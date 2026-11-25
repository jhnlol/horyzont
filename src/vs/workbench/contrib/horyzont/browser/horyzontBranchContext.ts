/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Sequencer } from '../../../../base/common/async.js';
import { Disposable, DisposableMap } from '../../../../base/common/lifecycle.js';
import { Schemas } from '../../../../base/common/network.js';
import { autorun } from '../../../../base/common/observable.js';
import { URI } from '../../../../base/common/uri.js';
import { localize, localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { IUriIdentityService } from '../../../../platform/uriIdentity/common/uriIdentity.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { EditorResourceAccessor, EditorsOrder, SideBySideEditor } from '../../../common/editor.js';
import { EditorGroupLayout, GroupsOrder, IEditorGroupsService } from '../../../services/editor/common/editorGroupsService.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';
import { IBreakpointData, IDebugService } from '../../debug/common/debug.js';
import { ISCMRepository, ISCMService } from '../../scm/common/scm.js';

const storageKey = 'horyzont.branchContexts';
const maxBranchesPerRepository = 40;
const branchRefPrefix = 'refs/heads/';

interface IGroupContext {
	readonly editors: string[];
	readonly active?: string;
}

interface IBreakpointContext extends IBreakpointData {
	readonly uri: string;
}

interface IBranchContext {
	readonly time: number;
	readonly layout: EditorGroupLayout;
	readonly groups: IGroupContext[];
	readonly breakpoints: IBreakpointContext[];
	readonly sideBar: boolean;
	readonly panel: boolean;
}

/** Saved contexts by repository root, then by branch name. */
type IContextStore = Record<string, Record<string, IBranchContext>>;

/**
 * Horyzont branch contexts: when the checked-out branch of a repository changes, remember the open
 * editors, editor layout, breakpoints and panels of the old branch and bring back those of the new one.
 */
export class HoryzontBranchContext extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.horyzontBranchContext';

	private readonly repositories = this._register(new DisposableMap<ISCMRepository>());
	private readonly sequencer = new Sequencer();

	constructor(
		@ISCMService scmService: ISCMService,
		@IEditorGroupsService private readonly editorGroupsService: IEditorGroupsService,
		@IEditorService private readonly editorService: IEditorService,
		@IDebugService private readonly debugService: IDebugService,
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
		@IStorageService private readonly storageService: IStorageService,
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@INotificationService private readonly notificationService: INotificationService,
		@IUriIdentityService private readonly uriIdentityService: IUriIdentityService,
		@ILogService private readonly logService: ILogService,
	) {
		super();
		this._register(scmService.onDidAddRepository(repository => this.watch(repository)));
		this._register(scmService.onDidRemoveRepository(repository => this.repositories.deleteAndDispose(repository)));
		for (const repository of scmService.repositories) {
			this.watch(repository);
		}
	}

	private watch(repository: ISCMRepository): void {
		const root = repository.provider.rootUri;
		if (!root || root.scheme !== Schemas.file && root.scheme !== Schemas.vscodeRemote) {
			return;
		}
		let current: string | undefined;
		this.repositories.set(repository, autorun(reader => {
			const ref = repository.provider.historyProvider.read(reader)?.historyItemRef.read(reader);
			if (!ref || !ref.id.startsWith(branchRefPrefix)) {
				return; // no repository state yet, or a detached HEAD (rebase, bisect): wait for a branch
			}
			const previous = current;
			current = ref.name;
			if (previous !== undefined && previous !== current && this.isEnabled()) {
				const next = current;
				this.sequencer.queue(() => this.switch(root, previous, next));
			}
		}));
	}

	private isEnabled(): boolean {
		return this.configurationService.getValue<boolean>('horyzont.branchContext.enabled') !== false;
	}

	private async switch(root: URI, from: string, to: string): Promise<void> {
		try {
			const store = this.readStore();
			const contexts = store[root.toString()] ??= {};
			contexts[from] = this.capture(root);
			trim(contexts);
			this.writeStore(store);

			const saved = contexts[to];
			if (saved) {
				await this.restore(root, saved);
				const count = saved.groups.reduce((sum, group) => sum + group.editors.length, 0);
				this.notificationService.status(localize('horyzont.branchContext.restored', "Restored the context of branch {0} ({1} editors)", to, count), { hideAfter: 4000 });
			}
		} catch (error) {
			this.logService.error('[Horyzont] Could not switch branch context', error);
		}
	}

	private isInRepository(root: URI, resource: URI | undefined): resource is URI {
		return !!resource && this.uriIdentityService.extUri.isEqualOrParent(resource, root);
	}

	private capture(root: URI): IBranchContext {
		const part = this.editorGroupsService.mainPart;
		const groups = part.getGroups(GroupsOrder.GRID_APPEARANCE).map(group => {
			const editors: string[] = [];
			for (const editor of group.getEditors(EditorsOrder.SEQUENTIAL)) {
				const resource = EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: SideBySideEditor.PRIMARY });
				if (this.isInRepository(root, resource)) {
					editors.push(resource.toString());
				}
			}
			const active = EditorResourceAccessor.getOriginalUri(group.activeEditor, { supportSideBySide: SideBySideEditor.PRIMARY });
			return { editors, active: this.isInRepository(root, active) ? active.toString() : undefined };
		});

		const breakpoints: IBreakpointContext[] = [];
		if (this.configurationService.getValue<boolean>('horyzont.branchContext.breakpoints') !== false) {
			for (const bp of this.debugService.getModel().getBreakpoints()) {
				if (this.isInRepository(root, bp.uri)) {
					breakpoints.push({ uri: bp.uri.toString(), lineNumber: bp.lineNumber, column: bp.column, enabled: bp.enabled, condition: bp.condition, hitCondition: bp.hitCondition, logMessage: bp.logMessage });
				}
			}
		}

		return {
			time: Date.now(),
			layout: part.getLayout(),
			groups,
			breakpoints,
			sideBar: this.layoutService.isVisible(Parts.SIDEBAR_PART),
			panel: this.layoutService.isVisible(Parts.PANEL_PART),
		};
	}

	private async restore(root: URI, context: IBranchContext): Promise<void> {
		const part = this.editorGroupsService.mainPart;

		// Close the editors of the old branch, but never one with unsaved changes.
		for (const group of part.getGroups(GroupsOrder.GRID_APPEARANCE)) {
			const toClose = group.getEditors(EditorsOrder.SEQUENTIAL).filter(editor =>
				!editor.isDirty() && this.isInRepository(root, EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: SideBySideEditor.PRIMARY })));
			if (toClose.length > 0) {
				await group.closeEditors(toClose, { preserveFocus: true });
			}
		}

		if (part.count !== context.groups.length) {
			part.applyLayout(context.layout);
		}
		const groups = part.getGroups(GroupsOrder.GRID_APPEARANCE);
		for (let i = 0; i < context.groups.length; i++) {
			const saved = context.groups[i];
			const group = groups[Math.min(i, groups.length - 1)];
			if (saved.editors.length === 0) {
				continue;
			}
			const ordered = saved.active ? [...saved.editors.filter(e => e !== saved.active), saved.active] : saved.editors;
			await this.editorService.openEditors(ordered.map(resource => ({
				resource: URI.parse(resource),
				options: { pinned: true, preserveFocus: true, inactive: resource !== saved.active },
			})), group.id, { validateTrust: true });
		}

		if (this.configurationService.getValue<boolean>('horyzont.branchContext.breakpoints') !== false) {
			const old = this.debugService.getModel().getBreakpoints().filter(bp => this.isInRepository(root, bp.uri));
			if (old.length > 0) {
				await this.debugService.removeBreakpoints(old.map(bp => bp.getId()));
			}
			const byResource = new Map<string, IBreakpointData[]>();
			for (const { uri, ...data } of context.breakpoints) {
				let list = byResource.get(uri);
				if (!list) {
					byResource.set(uri, list = []);
				}
				list.push(data);
			}
			for (const [uri, data] of byResource) {
				await this.debugService.addBreakpoints(URI.parse(uri), data, false);
			}
		}

		this.layoutService.setPartHidden(!context.sideBar, Parts.SIDEBAR_PART);
		this.layoutService.setPartHidden(!context.panel, Parts.PANEL_PART);
	}

	private readStore(): IContextStore {
		try {
			return JSON.parse(this.storageService.get(storageKey, StorageScope.WORKSPACE, '{}'));
		} catch {
			return {};
		}
	}

	private writeStore(store: IContextStore): void {
		this.storageService.store(storageKey, JSON.stringify(store), StorageScope.WORKSPACE, StorageTarget.MACHINE);
	}
}

/** Keeps only the most recently used branches of one repository. */
function trim(contexts: Record<string, IBranchContext>): void {
	const names = Object.keys(contexts);
	if (names.length <= maxBranchesPerRepository) {
		return;
	}
	names.sort((a, b) => contexts[b].time - contexts[a].time);
	for (const name of names.slice(maxBranchesPerRepository)) {
		delete contexts[name];
	}
}

registerAction2(class ForgetBranchContextsAction extends Action2 {
	constructor() {
		super({
			id: 'horyzont.forgetBranchContexts',
			title: localize2('horyzont.forgetBranchContexts', "Forget Saved Branch Contexts"),
			category: localize2('horyzont.category', "Horyzont"),
			f1: true,
		});
	}

	run(accessor: ServicesAccessor): void {
		accessor.get(IStorageService).remove(storageKey, StorageScope.WORKSPACE);
		accessor.get(INotificationService).status(localize('horyzont.branchContext.forgotten', "Saved branch contexts were removed"), { hideAfter: 3000 });
	}
});
