/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { mainWindow } from '../../../../base/browser/window.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { FontMeasurements } from '../../../../editor/browser/config/fontMeasurements.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { Extensions as WorkbenchExtensions, IWorkbenchContribution, IWorkbenchContributionsRegistry } from '../../../common/contributions.js';
import { LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';

/**
 * Horyzont bundles JetBrains Mono as a web font. Editors measure their font when they are created,
 * which can happen before the font file has loaded; once it has, measure again so cursor
 * positions and column widths match the glyphs that are actually drawn.
 */
class HoryzontBundledFontRemeasure extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.horyzontBundledFontRemeasure';

	constructor() {
		super();
		this.remeasureWhenLoaded();
	}

	private async remeasureWhenLoaded(): Promise<void> {
		const fonts = mainWindow.document.fonts;
		try {
			await Promise.all([
				fonts.load('400 14px "JetBrains Mono"'),
				fonts.load('700 14px "JetBrains Mono"'),
				fonts.load('italic 400 14px "JetBrains Mono"'),
			]);
		} catch {
			return;
		}
		if (!this._store.isDisposed) {
			FontMeasurements.clearAllFontInfos();
		}
	}
}

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(HoryzontBundledFontRemeasure, LifecyclePhase.Restored);
