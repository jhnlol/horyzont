/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RunOnceScheduler } from '../../../../base/common/async.js';
import { CancellationTokenSource } from '../../../../base/common/cancellation.js';
import { KeyChord, KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';
import { Disposable, DisposableStore, MutableDisposable } from '../../../../base/common/lifecycle.js';
import { autorun, IObservable, observableValue } from '../../../../base/common/observable.js';
import { ICodeEditor } from '../../../../editor/browser/editorBrowser.js';
import { EditorContributionInstantiation, registerEditorContribution } from '../../../../editor/browser/editorExtensions.js';
import { IRange, Range } from '../../../../editor/common/core/range.js';
import { IEditorContribution, IEditorDecorationsCollection } from '../../../../editor/common/editorCommon.js';
import { DocumentSymbol, SymbolKind } from '../../../../editor/common/languages.js';
import { IModelDeltaDecoration, ITextModel, TrackedRangeStickiness } from '../../../../editor/common/model.js';
import { ModelDecorationOptions } from '../../../../editor/common/model/textModel.js';
import { IOutlineModelService } from '../../../../editor/contrib/documentSymbols/browser/outlineModel.js';
import { localize, localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService, RawContextKey } from '../../../../platform/contextkey/common/contextkey.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator, ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { INotificationService, NotificationsFilter } from '../../../../platform/notification/common/notification.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';

const HoryzontFocusActiveContext = new RawContextKey<boolean>('horyzontFocusActive', false, localize('horyzontFocusActive', "Whether Horyzont Focus is on"));

const IHoryzontFocusService = createDecorator<IHoryzontFocusService>('horyzontFocusService');

interface IHoryzontFocusService {
	readonly _serviceBrand: undefined;
	readonly enabled: IObservable<boolean>;
	toggle(): void;
}

type ToggledPart = Parts.SIDEBAR_PART | Parts.PANEL_PART | Parts.AUXILIARYBAR_PART;

/**
 * Owns the on/off state of Horyzont Focus and the workbench chrome it quiets while it is on.
 */
class HoryzontFocusService extends Disposable implements IHoryzontFocusService {

	declare readonly _serviceBrand: undefined;

	private readonly _enabled = observableValue<boolean>(this, false);
	readonly enabled: IObservable<boolean> = this._enabled;

	private hiddenParts: ToggledPart[] = [];
	private previousFilter: NotificationsFilter | undefined;

	constructor(
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
		@INotificationService private readonly notificationService: INotificationService,
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
	) {
		super();
		const contextKey = HoryzontFocusActiveContext.bindTo(contextKeyService);
		this._register(autorun(reader => contextKey.set(this._enabled.read(reader))));
	}

	toggle(): void {
		const enable = !this._enabled.get();
		if (enable) {
			if (this.configurationService.getValue<boolean>('horyzont.focus.hideSideBars') !== false) {
				const parts: ToggledPart[] = [Parts.SIDEBAR_PART, Parts.PANEL_PART, Parts.AUXILIARYBAR_PART];
				this.hiddenParts = parts.filter(part => this.layoutService.isVisible(part));
				for (const part of this.hiddenParts) {
					this.layoutService.setPartHidden(true, part);
				}
			}
			if (this.configurationService.getValue<boolean>('horyzont.focus.silenceNotifications') !== false) {
				this.previousFilter = this.notificationService.getFilter();
				this.notificationService.setFilter(NotificationsFilter.ERROR);
			}
		} else {
			for (const part of this.hiddenParts) {
				this.layoutService.setPartHidden(false, part);
			}
			this.hiddenParts = [];
			if (this.previousFilter !== undefined) {
				this.notificationService.setFilter(this.previousFilter);
				this.previousFilter = undefined;
			}
		}
		this._enabled.set(enable, undefined);
	}
}

registerSingleton(IHoryzontFocusService, HoryzontFocusService, InstantiationType.Delayed);

const functionKinds = new Set([SymbolKind.Function, SymbolKind.Method, SymbolKind.Constructor]);
const containerKinds = new Set([SymbolKind.Class, SymbolKind.Interface, SymbolKind.Enum, SymbolKind.Struct]);
const maxParagraphLines = 200;

const dimmedDecoration = ModelDecorationOptions.register({
	description: 'horyzont-focus-dim',
	inlineClassName: 'horyzont-focus-dim',
	lineNumberClassName: 'horyzont-focus-dim',
	isWholeLine: true,
	stickiness: TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
});

/**
 * Dims everything outside the function (or class) that holds the cursor while Horyzont Focus is on.
 */
class HoryzontFocusController extends Disposable implements IEditorContribution {

	static readonly ID = 'editor.contrib.horyzontFocus';

	private readonly decorations: IEditorDecorationsCollection;
	private readonly listening = this._register(new MutableDisposable<DisposableStore>());
	private readonly scheduler = this._register(new RunOnceScheduler(() => this.update(), 120));
	private readonly pending = this._register(new MutableDisposable<CancellationTokenSource>());
	private focused: IRange | undefined;

	constructor(
		private readonly editor: ICodeEditor,
		@IHoryzontFocusService focusService: IHoryzontFocusService,
		@IOutlineModelService private readonly outlineModelService: IOutlineModelService,
	) {
		super();
		this.decorations = editor.createDecorationsCollection();
		if (editor.isSimpleWidget) {
			return;
		}
		this._register(autorun(reader => {
			if (focusService.enabled.read(reader)) {
				this.start();
			} else {
				this.stop();
			}
		}));
	}

	private start(): void {
		const store = new DisposableStore();
		store.add(this.editor.onDidChangeCursorPosition(() => this.scheduler.schedule()));
		store.add(this.editor.onDidChangeModelContent(() => this.scheduler.schedule()));
		store.add(this.editor.onDidChangeModel(() => {
			this.focused = undefined;
			this.decorations.clear();
			this.scheduler.schedule();
		}));
		this.listening.value = store;
		this.scheduler.schedule(0);
	}

	private stop(): void {
		this.listening.clear();
		this.scheduler.cancel();
		this.pending.clear();
		this.focused = undefined;
		this.decorations.clear();
	}

	private async update(): Promise<void> {
		const model = this.editor.getModel();
		const position = this.editor.getPosition();
		if (!model || !position) {
			return;
		}
		const cts = new CancellationTokenSource();
		this.pending.value = cts;

		let range: IRange | undefined;
		try {
			const outline = await this.outlineModelService.getOrCreate(model, cts.token);
			if (cts.token.isCancellationRequested) {
				return;
			}
			range = findEnclosingSymbol(outline.asListOfDocumentSymbols(), position.lineNumber);
		} catch {
			// no symbols, fall back to the paragraph below
		}
		if (cts.token.isCancellationRequested || this.editor.getModel() !== model) {
			return;
		}
		range ??= findParagraph(model, position.lineNumber);
		this.apply(model, range);
	}

	private apply(model: ITextModel, range: IRange): void {
		if (this.focused && this.focused.startLineNumber === range.startLineNumber && this.focused.endLineNumber === range.endLineNumber) {
			return;
		}
		this.focused = range;
		const lineCount = model.getLineCount();
		const decorations: IModelDeltaDecoration[] = [];
		if (range.startLineNumber > 1) {
			decorations.push({ range: new Range(1, 1, range.startLineNumber - 1, 1), options: dimmedDecoration });
		}
		if (range.endLineNumber < lineCount) {
			decorations.push({ range: new Range(range.endLineNumber + 1, 1, lineCount, 1), options: dimmedDecoration });
		}
		this.decorations.set(decorations);
	}
}

/**
 * Returns the innermost function-like symbol around the line, or else the innermost class-like one.
 */
function findEnclosingSymbol(symbols: DocumentSymbol[], lineNumber: number): IRange | undefined {
	let bestFunction: IRange | undefined;
	let bestContainer: IRange | undefined;
	for (const symbol of symbols) {
		const r = symbol.range;
		if (r.startLineNumber > lineNumber || r.endLineNumber < lineNumber) {
			continue;
		}
		const span = r.endLineNumber - r.startLineNumber;
		if (functionKinds.has(symbol.kind) && (!bestFunction || span <= bestFunction.endLineNumber - bestFunction.startLineNumber)) {
			bestFunction = r;
		} else if (containerKinds.has(symbol.kind) && (!bestContainer || span <= bestContainer.endLineNumber - bestContainer.startLineNumber)) {
			bestContainer = r;
		}
	}
	return bestFunction ?? bestContainer;
}

/**
 * Returns the block of non-empty lines around the line, for files without symbols (Markdown, plain text, configs).
 */
function findParagraph(model: ITextModel, lineNumber: number): IRange {
	const isBlank = (line: number) => model.getLineFirstNonWhitespaceColumn(line) === 0;
	let start = lineNumber;
	let end = lineNumber;
	const lineCount = model.getLineCount();
	while (start > 1 && lineNumber - start < maxParagraphLines && !isBlank(start - 1)) {
		start--;
	}
	while (end < lineCount && end - lineNumber < maxParagraphLines && !isBlank(end + 1)) {
		end++;
	}
	return new Range(start, 1, end, 1);
}

registerEditorContribution(HoryzontFocusController.ID, HoryzontFocusController, EditorContributionInstantiation.AfterFirstRender);

registerAction2(class ToggleHoryzontFocusAction extends Action2 {
	constructor() {
		super({
			id: 'horyzont.toggleFocus',
			title: localize2('horyzont.toggleFocus', "Toggle Horyzont Focus"),
			category: localize2('horyzont.category', "Horyzont"),
			f1: true,
			toggled: HoryzontFocusActiveContext,
			keybinding: {
				weight: KeybindingWeight.WorkbenchContrib,
				primary: KeyChord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyCode.Period),
			},
		});
	}

	run(accessor: ServicesAccessor): void {
		accessor.get(IHoryzontFocusService).toggle();
	}
});
