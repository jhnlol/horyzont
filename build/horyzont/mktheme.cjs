// Horyzont: generates the Horyzont Night / Horyzont Dawn color themes into extensions/theme-defaults.
// Run: node build/horyzont/mktheme.js
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', '..', 'extensions', 'theme-defaults');

function theme(name, base, type, c, t) {
	const colors = {
		'foreground': c.fg, 'descriptionForeground': c.muted, 'icon.foreground': c.muted, 'focusBorder': c.accent + '99',
		'textLink.foreground': c.accent, 'textLink.activeForeground': c.accent2,
		'button.background': c.accent, 'button.foreground': c.onAccent, 'button.hoverBackground': c.accentHover, 'button.border': c.accent,
		'button.secondaryBackground': c.raised, 'button.secondaryForeground': c.fg,
		'badge.background': c.accent, 'badge.foreground': c.onAccent,
		'activityBarBadge.background': c.accent, 'activityBarBadge.foreground': c.onAccent,
		'progressBar.background': c.accent,
		'editor.background': c.bg, 'editor.foreground': c.fg, 'editorGutter.background': c.bg,
		'editorLineNumber.foreground': c.faint + 'aa', 'editorLineNumber.activeForeground': c.fg,
		'editorCursor.foreground': c.accent2,
		'editor.selectionBackground': c.accent + '40', 'editor.inactiveSelectionBackground': c.accent + '22',
		'editor.selectionHighlightBackground': c.accent + '22', 'editor.wordHighlightBackground': c.accent + '1f',
		'editor.findMatchBackground': c.accent2 + '55', 'editor.findMatchHighlightBackground': c.accent2 + '26',
		'editor.lineHighlightBackground': c.line, 'editor.lineHighlightBorder': '#00000000',
		'editorIndentGuide.background1': c.border, 'editorIndentGuide.activeBackground1': c.faint,
		'editorBracketMatch.background': c.accent + '26', 'editorBracketMatch.border': c.accent + '80',
		'editorGutter.addedBackground': c.green, 'editorGutter.modifiedBackground': c.blue, 'editorGutter.deletedBackground': c.red,
		'editorWidget.background': c.raised, 'editorWidget.border': c.border, 'editorSuggestWidget.background': c.raised,
		'editorSuggestWidget.selectedBackground': c.accent + '33', 'editorHoverWidget.background': c.raised, 'editorHoverWidget.border': c.border,
		'editorGroupHeader.tabsBackground': c.side, 'editorGroupHeader.tabsBorder': c.border, 'editorGroup.border': c.border,
		'tab.activeBackground': c.bg, 'tab.activeForeground': c.fg, 'tab.inactiveBackground': c.side, 'tab.inactiveForeground': c.muted,
		'tab.activeBorderTop': c.accent, 'tab.activeBorder': c.bg, 'tab.border': c.side, 'tab.hoverBackground': c.raised,
		'tab.unfocusedActiveBorderTop': c.faint, 'tab.activeModifiedBorder': c.accent2,
		'sideBar.background': c.side, 'sideBar.foreground': c.fg, 'sideBar.border': c.border,
		'sideBarTitle.foreground': c.muted, 'sideBarSectionHeader.background': c.side, 'sideBarSectionHeader.border': c.border,
		'activityBar.background': c.side, 'activityBar.foreground': c.fg, 'activityBar.inactiveForeground': c.faint,
		'activityBar.activeBorder': c.accent, 'activityBar.border': c.border,
		'titleBar.activeBackground': c.side, 'titleBar.activeForeground': c.fg, 'titleBar.inactiveBackground': c.side, 'titleBar.border': c.border,
		'commandCenter.background': c.raised, 'commandCenter.border': c.border, 'commandCenter.activeBackground': c.accent + '22',
		'statusBar.background': c.side, 'statusBar.foreground': c.muted, 'statusBar.border': c.border,
		'statusBar.debuggingBackground': c.accent2, 'statusBar.debuggingForeground': c.onAccent2,
		'statusBar.noFolderBackground': c.side, 'statusBarItem.remoteBackground': c.accent, 'statusBarItem.remoteForeground': c.onAccent,
		'statusBarItem.hoverBackground': c.raised,
		'panel.background': c.side, 'panel.border': c.border, 'panelTitle.activeBorder': c.accent, 'panelTitle.activeForeground': c.fg, 'panelTitle.inactiveForeground': c.muted,
		'terminal.background': c.side, 'terminal.foreground': c.fg, 'terminalCursor.foreground': c.accent2,
		'terminal.ansiBlack': c.raised, 'terminal.ansiRed': c.red, 'terminal.ansiGreen': c.green, 'terminal.ansiYellow': c.accent2,
		'terminal.ansiBlue': c.blue, 'terminal.ansiMagenta': c.accent, 'terminal.ansiCyan': c.cyan, 'terminal.ansiWhite': c.fg,
		'list.activeSelectionBackground': c.accent + '33', 'list.activeSelectionForeground': c.fg, 'list.inactiveSelectionBackground': c.accent + '1f',
		'list.hoverBackground': c.raised, 'list.focusOutline': c.accent + '80', 'list.highlightForeground': c.accentText,
		'input.background': c.bg, 'input.border': c.border, 'input.foreground': c.fg, 'input.placeholderForeground': c.faint,
		'inputOption.activeBorder': c.accent, 'inputOption.activeBackground': c.accent + '33',
		'dropdown.background': c.raised, 'dropdown.border': c.border,
		'quickInput.background': c.raised, 'quickInputList.focusBackground': c.accent + '33', 'widget.border': c.border, 'widget.shadow': c.shadow,
		'menu.background': c.raised, 'menu.border': c.border, 'menu.selectionBackground': c.accent + '33',
		'scrollbarSlider.background': c.faint + '40', 'scrollbarSlider.hoverBackground': c.faint + '66', 'scrollbarSlider.activeBackground': c.accent + '80',
		'gitDecoration.modifiedResourceForeground': c.blue, 'gitDecoration.untrackedResourceForeground': c.green,
		'gitDecoration.deletedResourceForeground': c.red, 'gitDecoration.conflictingResourceForeground': c.accent2,
		'chat.requestBackground': c.raised, 'chat.slashCommandForeground': c.accent, 'chat.avatarBackground': c.accent,
		'inlineChat.background': c.raised, 'inlineChat.border': c.accent + '66',
		'editorInlayHint.background': c.raised, 'editorInlayHint.foreground': c.faint,
		'welcomePage.tileBackground': c.raised, 'welcomePage.tileHoverBackground': c.line, 'welcomePage.tileBorder': c.border,
		'minimap.background': c.bg, 'minimapSlider.background': c.faint + '26',
		// Modern UI (floating cards)
		'modernUI.shellBackground': c.shell, 'modernUI.inactiveShellBackground': c.shell,
		'modernPanel.border': c.cardBorder,
		'editorGroupHeader.connectedTabsBackground': c.side,
		'modernEditorTab.activeBackground': c.bg, 'modernEditorTab.hoverBackground': c.raised,
		'modernTab.activeForeground': c.fg, 'modernTab.hoverBackground': c.raised,
		'modernActivityBarItem.activeBackground': c.accent + '2e', 'modernActivityBarItem.activeForeground': c.accentText,
		'modernActivityBarItem.hoverBackground': c.raised, 'modernActivityBarItem.hoverForeground': c.fg,
		'modernSash.gripForeground': c.accent + '99',
		'titleBar.activeBackground': c.shell, 'titleBar.inactiveBackground': c.shell, 'titleBar.border': '#00000000',
		'statusBar.background': c.shell, 'statusBar.border': '#00000000', 'statusBar.noFolderBackground': c.shell,
		'tab.activeBorderTop': '#00000000', 'tab.unfocusedActiveBorderTop': '#00000000',
		'activityBar.activeBorder': '#00000000', 'activityBar.activeForeground': c.accentText,
		'notifications.background': c.raised, 'notifications.border': c.border, 'notificationToast.border': c.border,
		'sash.hoverBorder': c.accent + '99',
		'editorGroupHeader.tabsBorder': c.border,
		'chat.requestBorder': c.border,
		// horyzont.css reads the secondary gradient hue from this registered color
		'terminal.ansiBrightMagenta': c.pink,
		// Horyzont edit traces beside the line numbers
		'horyzont.editTrace': c.accent2,
		// Calm brackets: no rainbow, just two soft tones
		'editorBracketHighlight.foreground1': t.op, 'editorBracketHighlight.foreground2': t.keyword, 'editorBracketHighlight.foreground3': t.func,
		'editorBracketHighlight.foreground4': t.op, 'editorBracketHighlight.foreground5': t.keyword, 'editorBracketHighlight.foreground6': t.func,
		'editorBracketHighlight.unexpectedBracket.foreground': c.red,
		'editorBracketPairGuide.activeBackground1': c.faint, 'editorBracketPairGuide.activeBackground2': c.faint, 'editorBracketPairGuide.activeBackground3': c.faint,
		'editorBracketPairGuide.activeBackground4': c.faint, 'editorBracketPairGuide.activeBackground5': c.faint, 'editorBracketPairGuide.activeBackground6': c.faint
	};
	const S = (scope, fg, fs) => ({ scope, settings: fs ? { foreground: fg, fontStyle: fs } : { foreground: fg } });
	const tokenColors = [
		S(['comment', 'punctuation.definition.comment'], t.comment, 'italic'),
		S(['keyword', 'storage', 'storage.type', 'keyword.control'], t.keyword),
		S(['keyword.operator'], t.op),
		S(['string', 'string.quoted', 'punctuation.definition.string'], t.string),
		S(['constant.numeric', 'constant.language', 'constant.character'], t.number),
		S(['entity.name.function', 'support.function', 'meta.function-call'], t.func),
		S(['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'entity.other.inherited-class'], t.type),
		S(['variable', 'meta.definition.variable'], t.variable),
		S(['variable.other.property', 'support.variable.property', 'meta.object-literal.key'], t.prop),
		S(['support.type.property-name', 'support.type.property-name.json', 'punctuation.support.type.property-name'], t.func),
		S(['punctuation', 'meta.brace', 'punctuation.separator', 'punctuation.terminator'], t.op),
		S(['variable.parameter'], t.param, 'italic'),
		S(['entity.name.tag', 'punctuation.definition.tag'], t.tag),
		S(['entity.other.attribute-name'], t.attr),
		S(['markup.heading', 'entity.name.section'], t.keyword, 'bold'),
		S(['markup.bold'], t.number, 'bold'), S(['markup.italic'], t.type, 'italic'),
		S(['markup.inline.raw', 'markup.fenced_code'], t.string),
		S(['invalid'], c.red)
	];
	return {
		$schema: 'vscode://schemas/color-theme', name, include: base, type, colors, tokenColors, semanticHighlighting: true,
		semanticTokenColors: { parameter: { foreground: t.param, italic: true }, property: t.prop, enumMember: t.number, namespace: t.type }
	};
}

const night = theme('Horyzont Night', './2026-dark.json', 'dark',
	{
		shell: '#141416', bg: '#1C1C1F', side: '#18181B', raised: '#232327', line: '#212125', border: '#2A2A2F', cardBorder: '#FFFFFF0A',
		fg: '#D6D3CE', muted: '#8E8A85', faint: '#57544F',
		accent: '#8FA6C9', accentText: '#AFC0DA', accentHover: '#9DB2D2', onAccent: '#16161A', accent2: '#D9B98C', onAccent2: '#1C1610', pink: '#C79A9E',
		green: '#9DB98A', blue: '#8FA6C9', red: '#D08A8A', cyan: '#8FBFB8', shadow: '#00000080'
	},
	{
		comment: '#6E6A64', keyword: '#B3A2C9', op: '#A8A29A', string: '#A8BC8F', number: '#D4A981', func: '#93ADCF', type: '#8FBFB8',
		variable: '#D6D3CE', prop: '#C2BAAF', param: '#D3A6A0', tag: '#CF9C9C', attr: '#D4A981'
	});
const dawn = theme('Horyzont Dawn', './2026-light.json', 'light',
	{
		shell: '#E8E5DF', bg: '#FAF8F4', side: '#F3F0EA', raised: '#FFFFFF', line: '#F1EDE6', border: '#E2DDD4', cardBorder: '#00000010',
		fg: '#3A3835', muted: '#77736C', faint: '#ABA69D',
		accent: '#5F7AA6', accentText: '#4F6A96', accentHover: '#526D99', onAccent: '#FFFFFF', accent2: '#A87B45', onAccent2: '#FFFFFF', pink: '#A86C72',
		green: '#5E8A4E', blue: '#4F6A96', red: '#B05A5A', cyan: '#3F7D76', shadow: '#0000001F'
	},
	{
		comment: '#9B968D', keyword: '#7A5E9E', op: '#6E6A63', string: '#5E7F45', number: '#A0672B', func: '#3F6496', type: '#2E7A72',
		variable: '#3A3835', prop: '#6A5D4E', param: '#A0574F', tag: '#A84E4E', attr: '#A0672B'
	});

const extra = [
	theme('Horyzont Abyss', './2026-dark.json', 'dark',
		{
			shell: '#000000', bg: '#050506', side: '#0A0A0C', raised: '#141417', line: '#0F0F12', border: '#1C1C21', cardBorder: '#FFFFFF0D',
			fg: '#CFCCC6', muted: '#85817B', faint: '#4A4743',
			accent: '#9A8FD0', accentText: '#B5ACE0', accentHover: '#A79DD8', onAccent: '#0A0A0C', accent2: '#E0B872', onAccent2: '#140F05', pink: '#D49AB5',
			green: '#8FC79A', blue: '#8AA8E0', red: '#E08A8A', cyan: '#7FC7C0', shadow: '#000000CC'
		},
		{
			comment: '#5E5B57', keyword: '#B0A3E6', op: '#9C978F', string: '#9CCB91', number: '#E2AE77', func: '#8DB3EA', type: '#7FCBC2',
			variable: '#CFCCC6', prop: '#C9BBA8', param: '#E0A6B2', tag: '#E39595', attr: '#E2AE77'
		}),
	theme('Horyzont Ember', './2026-dark.json', 'dark',
		{
			shell: '#17120F', bg: '#1E1814', side: '#1A1511', raised: '#26201B', line: '#231C17', border: '#312821', cardBorder: '#FFFFFF0A',
			fg: '#E3D6C8', muted: '#9C8C7C', faint: '#5F5247',
			accent: '#D9895B', accentText: '#E8A37C', accentHover: '#E09669', onAccent: '#1A110B', accent2: '#E6C07B', onAccent2: '#1C1508', pink: '#D69A9A',
			green: '#A7B97C', blue: '#8FA9C2', red: '#DE7F72', cyan: '#8FBDAF', shadow: '#00000080'
		},
		{
			comment: '#7A6B5E', keyword: '#DE8E73', op: '#B3A291', string: '#B5C285', number: '#E6B873', func: '#9DB7CC', type: '#8FC2B2',
			variable: '#E3D6C8', prop: '#D1BBA3', param: '#E2A3A0', tag: '#DE8B7E', attr: '#E6B873'
		}),
	theme('Horyzont Moss', './2026-dark.json', 'dark',
		{
			shell: '#121613', bg: '#181D1A', side: '#151916', raised: '#1F2621', line: '#1C221E', border: '#28302A', cardBorder: '#FFFFFF0A',
			fg: '#D3D8CF', muted: '#879084', faint: '#515A50',
			accent: '#86B58E', accentText: '#A3C9A9', accentHover: '#93BE9A', onAccent: '#0F1510', accent2: '#D6BE86', onAccent2: '#1A160A', pink: '#C99AA6',
			green: '#9CC28C', blue: '#8EAFC4', red: '#D18A84', cyan: '#84BDB3', shadow: '#00000080'
		},
		{
			comment: '#6A7468', keyword: '#B8A6CF', op: '#A2A99C', string: '#A9C78E', number: '#DDB27E', func: '#8FB6CF', type: '#87C2B5',
			variable: '#D3D8CF', prop: '#C3C6B0', param: '#D6A7A0', tag: '#D19A8F', attr: '#DDB27E'
		}),
	theme('Horyzont Fjord', './2026-dark.json', 'dark',
		{
			shell: '#13171D', bg: '#191E25', side: '#161A21', raised: '#20262F', line: '#1D232B', border: '#29303A', cardBorder: '#FFFFFF0A',
			fg: '#D2D8E0', muted: '#8790A0', faint: '#4F5868',
			accent: '#7FA8D9', accentText: '#A1C0E6', accentHover: '#8DB3DF', onAccent: '#0E131A', accent2: '#E0BE8A', onAccent2: '#1A140A', pink: '#C6A0C9',
			green: '#9BC29A', blue: '#7FA8D9', red: '#D98C93', cyan: '#86C4CF', shadow: '#00000080'
		},
		{
			comment: '#65707F', keyword: '#A9A5DB', op: '#9EA6B3', string: '#A3C79A', number: '#DDAE86', func: '#86B6E3', type: '#86C4CF',
			variable: '#D2D8E0', prop: '#B9C3D1', param: '#D7A3B0', tag: '#D9939B', attr: '#DDAE86'
		}),
	theme('Horyzont Paper', './2026-light.json', 'light',
		{
			shell: '#E6DFD2', bg: '#F6F1E7', side: '#EFE8DB', raised: '#FBF8F1', line: '#EDE6D8', border: '#DDD3C2', cardBorder: '#00000012',
			fg: '#3B342B', muted: '#7A6F60', faint: '#AFA493',
			accent: '#8A5A3B', accentText: '#7A4D30', accentHover: '#7C5034', onAccent: '#FFFFFF', accent2: '#4F7A6A', onAccent2: '#FFFFFF', pink: '#A35F6E',
			green: '#5B7F3F', blue: '#3F648A', red: '#A9473F', cyan: '#2F7770', shadow: '#0000001F'
		},
		{
			comment: '#A0937F', keyword: '#8A4F7A', op: '#6E6455', string: '#5B7F3F', number: '#A35E1F', func: '#3F648A', type: '#2F7770',
			variable: '#3B342B', prop: '#6B5A44', param: '#A0504A', tag: '#A9473F', attr: '#A35E1F'
		}),
	theme('Horyzont Mist', './2026-light.json', 'light',
		{
			shell: '#E3E7EC', bg: '#F7F9FB', side: '#EEF1F5', raised: '#FFFFFF', line: '#EDF1F5', border: '#DAE0E7', cardBorder: '#00000010',
			fg: '#2F3640', muted: '#6B7480', faint: '#A3ABB6',
			accent: '#4D74B8', accentText: '#3F65A8', accentHover: '#4268AD', onAccent: '#FFFFFF', accent2: '#B07A3A', onAccent2: '#FFFFFF', pink: '#A6628A',
			green: '#4C8A5A', blue: '#3F65A8', red: '#B4505A', cyan: '#2E7F88', shadow: '#0000001A'
		},
		{
			comment: '#9AA2AD', keyword: '#7656A8', op: '#66707C', string: '#4C8A5A', number: '#A8662A', func: '#3460A8', type: '#2E7F88',
			variable: '#2F3640', prop: '#5A6473', param: '#A85462', tag: '#B4505A', attr: '#A8662A'
		}),
];

const all = [night, dawn, ...extra];
const slug = t => t.name.toLowerCase().replace(/\s+/g, '-');
const labelKey = t => t.name.replace(/\s+/g, '').replace(/^./, ch => ch.toLowerCase()) + 'ThemeLabel';
for (const t of all) {
	fs.writeFileSync(path.join(dir, 'themes', slug(t) + '.json'), JSON.stringify(t, null, '\t') + '\n');
}

const pkgPath = path.join(dir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.contributes.themes = pkg.contributes.themes.filter(x => !x.id.startsWith('Horyzont'));
pkg.contributes.themes.unshift(...all.map(t => ({ id: t.name, label: '%' + labelKey(t) + '%', uiTheme: t.type === 'dark' ? 'vs-dark' : 'vs', path: './themes/' + slug(t) + '.json' })));
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const nlsPath = path.join(dir, 'package.nls.json');
const nls = JSON.parse(fs.readFileSync(nlsPath, 'utf8'));
for (const t of all) {
	nls[labelKey(t)] = t.name;
}
fs.writeFileSync(nlsPath, JSON.stringify(nls, null, '\t') + '\n');
console.log('Horyzont themes written: ' + all.map(t => t.name).join(', '));
