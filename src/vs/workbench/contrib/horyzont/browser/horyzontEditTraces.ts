/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IntervalTimer } from '../../../../base/common/async.js';
import { Disposable, DisposableMap, DisposableStore, MutableDisposable } from '../../../../base/common/lifecycle.js';
import { Schemas } from '../../../../base/common/network.js';
import { Range } from '../../../../editor/common/core/range.js';
import { IModelDecorationOptions, ITextModel, TrackedRangeStickiness } from '../../../../editor/common/model.js';
import { ModelDecorationOptions } from '../../../../editor/common/model/textModel.js';
import { IModelService } from '../../../../editor/common/services/model.js';
import { IModelContentChangedEvent } from '../../../../editor/common/textModelEvents.js';
import { localize } from '../../../../nls.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { registerColor } from '../../../../platform/theme/common/colorUtils.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';

registerColor('horyzont.editTrace', { dark: '#D9B98C', light: '#A87B45', hcDark: '#FFD27A', hcLight: '#8A5A1F' }, localize('horyzont.editTrace', "Color of the Horyzont edit traces next to the line numbers."));

const description = 'horyzont-edit-trace';
const tick = 30 * 1000;
/** Upper bounds (ms) of each age bucket; edits older than the last one fade out completely. */
const buckets = [60 * 1000, 10 * 60 * 1000, 60 * 60 * 1000, 4 * 60 * 60 * 1000, 12 * 60 * 60 * 1000];
/** Changes that touch more lines than this (formatting, big pastes) are not traced line by line. */
const maxLinesPerChange = 400;
const trackedSchemes = new Set<string>([Schemas.file, Schemas.untitled, Schemas.vscodeRemote, Schemas.vscodeUserData, Schemas.vscodeNotebookCell]);

const options: IModelDecorationOptions[] = buckets.map((_, i) => ModelDecorationOptions.register({
	description,
	lineNumberClassName: `horyzont-trace horyzont-trace-${i}`,
	isWholeLine: true,
	stickiness: TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
}));

function bucketOf(age: number): number {
	const index = buckets.findIndex(limit => age < limit);
	return index === -1 ? buckets.length : index;
}

interface ITrace {
	time: number;
	bucket: number;
}

/**
 * Remembers when each line of one text model was last edited, as decorations that move with the text.
 */
class ModelEditTraces extends Disposable {

	private readonly traces = new Map<string, ITrace>();

	constructor(private readonly model: ITextModel) {
		super();
		this._register(model.onDidChangeContent(e => this.onDidChangeContent(e)));
	}

	get isEmpty(): boolean {
		return this.traces.size === 0;
	}

	private onDidChangeContent(e: IModelContentChangedEvent): void {
		if (e.isFlush) {
			this.clear();
			return;
		}

		// Changes arrive bottom-up, each in the coordinates left by the ones before it, so
		// walk them top-down and shift every change by the line delta of the ones above it.
		const lines = new Set<number>();
		let delta = 0;
		for (let i = e.changes.length - 1; i >= 0; i--) {
			const change = e.changes[i];
			let added = 0;
			for (let at = change.text.indexOf('\n'); at !== -1; at = change.text.indexOf('\n', at + 1)) {
				added++;
			}
			const removed = change.range.endLineNumber - change.range.startLineNumber;
			if (added <= maxLinesPerChange) {
				const start = change.range.startLineNumber + delta;
				for (let line = start; line <= start + added; line++) {
					lines.add(line);
				}
			}
			delta += added - removed;
		}
		if (lines.size > 0) {
			this.mark(lines);
		}
	}

	private mark(lines: Set<number>): void {
		const now = Date.now();
		const lineCount = this.model.getLineCount();
		this.model.changeDecorations(accessor => {
			for (const line of lines) {
				if (line < 1 || line > lineCount) {
					continue;
				}
				const existing = this.model.getLineDecorations(line).filter(d => this.traces.has(d.id));
				const [keep, ...extra] = existing;
				for (const d of extra) {
					accessor.removeDecoration(d.id);
					this.traces.delete(d.id);
				}
				if (keep) {
					const trace = this.traces.get(keep.id)!;
					trace.time = now;
					if (trace.bucket !== 0) {
						trace.bucket = 0;
						accessor.changeDecorationOptions(keep.id, options[0]);
					}
				} else {
					const id = accessor.addDecoration(new Range(line, 1, line, 1), options[0]);
					this.traces.set(id, { time: now, bucket: 0 });
				}
			}
		});
	}

	/** Moves traces into older buckets as time passes and drops the ones that have faded out. */
	age(now: number): void {
		const changes: [string, number][] = [];
		for (const [id, trace] of this.traces) {
			const bucket = bucketOf(now - trace.time);
			if (bucket !== trace.bucket) {
				changes.push([id, bucket]);
			}
		}
		if (changes.length === 0) {
			return;
		}
		this.model.changeDecorations(accessor => {
			for (const [id, bucket] of changes) {
				if (bucket >= buckets.length) {
					accessor.removeDecoration(id);
					this.traces.delete(id);
				} else {
					accessor.changeDecorationOptions(id, options[bucket]);
					this.traces.get(id)!.bucket = bucket;
				}
			}
		});
	}

	private clear(): void {
		if (this.traces.size > 0 && !this.model.isDisposed()) {
			this.model.deltaDecorations([...this.traces.keys()], []);
		}
		this.traces.clear();
	}

	override dispose(): void {
		this.clear();
		super.dispose();
	}
}

/**
 * Horyzont edit traces: a soft amber mark beside the line numbers of recently edited lines that fades over a few hours.
 */
export class HoryzontEditTraces extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.horyzontEditTraces';

	private readonly models = this._register(new DisposableMap<ITextModel, ModelEditTraces>());
	private readonly timer = this._register(new IntervalTimer());
	private readonly listeners = this._register(new MutableDisposable<DisposableStore>());

	constructor(
		@IModelService private readonly modelService: IModelService,
		@IConfigurationService private readonly configurationService: IConfigurationService,
	) {
		super();
		this._register(configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('horyzont.editTraces.enabled')) {
				this.update();
			}
		}));
		this.update();
	}

	private update(): void {
		const enabled = this.configurationService.getValue<boolean>('horyzont.editTraces.enabled') !== false;
		if (enabled && !this.listeners.value) {
			const store = new DisposableStore();
			store.add(this.modelService.onModelAdded(model => this.track(model)));
			store.add(this.modelService.onModelRemoved(model => this.models.deleteAndDispose(model)));
			this.listeners.value = store;
			for (const model of this.modelService.getModels()) {
				this.track(model);
			}
			this.timer.cancelAndSet(() => this.age(), tick);
		} else if (!enabled && this.listeners.value) {
			this.listeners.clear();
			this.timer.cancel();
			this.models.clearAndDisposeAll();
		}
	}

	private track(model: ITextModel): void {
		if (model.isForSimpleWidget || model.isTooLargeForSyncing() || !trackedSchemes.has(model.uri.scheme)) {
			return;
		}
		this.models.set(model, new ModelEditTraces(model));
	}

	private age(): void {
		const now = Date.now();
		for (const [, traces] of this.models) {
			if (!traces.isEmpty) {
				traces.age(now);
			}
		}
	}
}
