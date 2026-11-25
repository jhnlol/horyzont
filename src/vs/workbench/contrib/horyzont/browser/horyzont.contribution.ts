/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/horyzontFeatures.css';
import './horyzontFocus.js';
import { localize } from '../../../../nls.js';
import { ConfigurationScope, Extensions as ConfigurationExtensions, IConfigurationRegistry } from '../../../../platform/configuration/common/configurationRegistry.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { HoryzontBranchContext } from './horyzontBranchContext.js';
import { HoryzontEditTraces } from './horyzontEditTraces.js';

Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration).registerConfiguration({
	id: 'horyzont',
	order: 1,
	title: localize('horyzontConfigurationTitle', "Horyzont"),
	type: 'object',
	properties: {
		'horyzont.focus.hideSideBars': {
			type: 'boolean',
			default: true,
			scope: ConfigurationScope.APPLICATION,
			description: localize('horyzont.focus.hideSideBars', "Controls whether Horyzont Focus hides the side bars and the panel while it is on."),
		},
		'horyzont.focus.silenceNotifications': {
			type: 'boolean',
			default: true,
			scope: ConfigurationScope.APPLICATION,
			description: localize('horyzont.focus.silenceNotifications', "Controls whether Horyzont Focus shows only error notifications while it is on."),
		},
		'horyzont.editTraces.enabled': {
			type: 'boolean',
			default: true,
			description: localize('horyzont.editTraces.enabled', "Controls whether recently edited lines get a mark next to their line number that fades over a few hours."),
		},
		'horyzont.branchContext.enabled': {
			type: 'boolean',
			default: true,
			scope: ConfigurationScope.WINDOW,
			description: localize('horyzont.branchContext.enabled', "Controls whether switching git branches saves the open editors and layout of the old branch and restores those of the new one. Editors with unsaved changes are never closed."),
		},
		'horyzont.branchContext.breakpoints': {
			type: 'boolean',
			default: true,
			scope: ConfigurationScope.WINDOW,
			description: localize('horyzont.branchContext.breakpoints', "Controls whether branch contexts also save and restore breakpoints."),
		},
	}
});

registerWorkbenchContribution2(HoryzontEditTraces.ID, HoryzontEditTraces, WorkbenchPhase.AfterRestored);
registerWorkbenchContribution2(HoryzontBranchContext.ID, HoryzontBranchContext, WorkbenchPhase.Eventually);
