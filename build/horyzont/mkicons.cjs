// Horyzont: generates the "Horyzont Icons" file icon theme into extensions/theme-horyzont-icons.
// Run: node build/horyzont/mkicons.cjs
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..', 'extensions', 'theme-horyzont-icons');
const iconsDir = path.join(root, 'icons');
fs.rmSync(iconsDir, { recursive: true, force: true });
fs.mkdirSync(iconsDir, { recursive: true });

const FONT = `font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-weight="800" text-anchor="middle"`;

/** Rounded badge with a short label, e.g. TS, JS. */
function badge(label, bg, fg = '#FFFFFF') {
	const size = label.length >= 3 ? 10.5 : label.length === 2 ? 13 : 17;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect x="3" y="3" width="26" height="26" rx="7" fill="${bg}"/>
<rect x="3" y="3" width="26" height="26" rx="7" fill="url(#g)"/>
<text x="16" y="${16 + size * 0.36}" font-size="${size}" ${FONT} fill="${fg}">${label}</text>
</svg>`;
}

/** Document outline for generic files. */
function doc(color) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
<path d="M8 3.5h10.5L25 10v16.5A2.5 2.5 0 0 1 22.5 29h-14A2.5 2.5 0 0 1 6 26.5v-20A3 3 0 0 1 8 3.5Z" fill="${color}" fill-opacity=".16" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M18 3.8V9a1.5 1.5 0 0 0 1.5 1.5h5.2" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M10.5 16h10M10.5 20.5h7" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;
}

/** Folder, closed or open, optionally with a small glyph. */
function folder(color, open, glyph = '') {
	const body = open
		? `<path d="M3 9a3 3 0 0 1 3-3h6l3 3h11a3 3 0 0 1 3 3v1H9.5a3 3 0 0 0-2.8 2L3 25V9Z" fill="${color}" fill-opacity=".75"/>
<path d="M7 15.5A2.5 2.5 0 0 1 9.4 14H29a1.5 1.5 0 0 1 1.4 2l-3.2 9.5A2.5 2.5 0 0 1 24.8 27H5a1.5 1.5 0 0 1-1.4-2L7 15.5Z" fill="${color}"/>`
		: `<path d="M3 9a3 3 0 0 1 3-3h6l3 3h11a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9Z" fill="${color}"/>
<path d="M3 12h26" stroke="#fff" stroke-opacity=".25" stroke-width="1.5"/>`;
	const g = glyph ? `<text x="${open ? 18 : 16}" y="${open ? 25.5 : 24.5}" font-size="13.5" ${FONT} fill="#fff" fill-opacity=".92">${glyph}</text>` : '';
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${body}${g}</svg>`;
}

const defs = {};
function def(id, svg) {
	fs.writeFileSync(path.join(iconsDir, id + '.svg'), svg);
	defs[id] = { iconPath: `./icons/${id}.svg` };
	return id;
}

// ---- Base ----
def('file', doc('#8A93A8'));
def('folder', folder('#8B7CF6', false));
def('folder-open', folder('#A497FA', true));
def('root', folder('#6D5CE8', false));
def('root-open', folder('#8B7CF6', true));

// ---- Languages: [id, label, bg, fg?, extensions[], languageIds[]] ----
const langs = [
	['ts', 'TS', '#3178C6', '#fff', ['ts', 'mts', 'cts'], ['typescript']],
	['tsx', 'TSX', '#0EA5E9', '#fff', ['tsx'], ['typescriptreact']],
	['dts', 'D', '#2B5E9E', '#fff', ['d.ts'], []],
	['js', 'JS', '#F7DF1E', '#1F1F1F', ['js', 'mjs', 'cjs'], ['javascript']],
	['jsx', 'JSX', '#FACC15', '#1F1F1F', ['jsx'], ['javascriptreact']],
	['json', '{}', '#F59E0B', '#1F1F1F', ['json', 'jsonc', 'json5'], ['json', 'jsonc']],
	['css', 'CSS', '#6366F1', '#fff', ['css'], ['css']],
	['scss', 'S', '#EC4899', '#fff', ['scss', 'sass'], ['scss', 'sass']],
	['less', 'L', '#2A4D80', '#fff', ['less'], ['less']],
	['html', '&lt;/&gt;', '#F97316', '#fff', ['html', 'htm'], ['html']],
	['md', 'M↓', '#64748B', '#fff', ['md', 'mdx', 'markdown'], ['markdown']],
	['py', 'PY', '#3776AB', '#FFD43B', ['py', 'pyi', 'pyw'], ['python']],
	['ipynb', 'NB', '#F37626', '#fff', ['ipynb'], []],
	['rs', 'RS', '#DE6A3A', '#fff', ['rs'], ['rust']],
	['go', 'GO', '#00ADD8', '#fff', ['go'], ['go']],
	['java', 'JV', '#E76F00', '#fff', ['java', 'jar'], ['java']],
	['kt', 'KT', '#A855F7', '#fff', ['kt', 'kts'], ['kotlin']],
	['c', 'C', '#5C6BC0', '#fff', ['c', 'h'], ['c']],
	['cpp', 'C++', '#00599C', '#fff', ['cpp', 'cc', 'cxx', 'hpp', 'hh', 'hxx'], ['cpp']],
	['cs', 'C#', '#7C3AED', '#fff', ['cs', 'csx'], ['csharp']],
	['php', 'PHP', '#777BB4', '#fff', ['php'], ['php']],
	['rb', 'RB', '#CC342D', '#fff', ['rb', 'gemspec'], ['ruby']],
	['swift', 'SW', '#F05138', '#fff', ['swift'], ['swift']],
	['dart', 'DT', '#0175C2', '#fff', ['dart'], ['dart']],
	['lua', 'LUA', '#2C2D72', '#fff', ['lua'], ['lua']],
	['sh', '$_', '#22C55E', '#0B1A10', ['sh', 'bash', 'zsh', 'fish'], ['shellscript']],
	['ps1', 'PS', '#2D6BC4', '#fff', ['ps1', 'psm1', 'psd1'], ['powershell']],
	['bat', 'BAT', '#4B5563', '#fff', ['bat', 'cmd'], ['bat']],
	['yaml', 'YML', '#CB171E', '#fff', ['yml', 'yaml'], ['yaml']],
	['toml', 'TML', '#9C4221', '#fff', ['toml'], ['toml']],
	['xml', 'XML', '#E37933', '#fff', ['xml', 'xsd', 'plist'], ['xml']],
	['sql', 'SQL', '#0EA5E9', '#fff', ['sql', 'sqlite', 'db'], ['sql']],
	['vue', 'V', '#41B883', '#fff', ['vue'], ['vue']],
	['svelte', 'SV', '#FF3E00', '#fff', ['svelte'], ['svelte']],
	['svg', 'SVG', '#FFB13B', '#1F1F1F', ['svg'], []],
	['img', 'IMG', '#D946EF', '#fff', ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'avif', 'tiff'], []],
	['font', 'Aa', '#E11D48', '#fff', ['woff', 'woff2', 'ttf', 'otf', 'eot'], []],
	['zip', 'ZIP', '#78716C', '#fff', ['zip', 'tar', 'gz', 'tgz', '7z', 'rar'], []],
	['pdf', 'PDF', '#DC2626', '#fff', ['pdf'], []],
	['lock', 'LCK', '#57534E', '#fff', ['lock'], []],
	['log', 'LOG', '#475569', '#fff', ['log'], ['log']],
	['txt', 'TXT', '#6B7280', '#fff', ['txt'], ['plaintext']],
	['env', 'ENV', '#EAB308', '#1F1F1F', ['env'], ['dotenv']],
	['test', 'T', '#16A34A', '#fff', ['test.ts', 'spec.ts', 'test.js', 'spec.js', 'test.tsx', 'spec.tsx'], []],
	['graphql', 'GQL', '#E10098', '#fff', ['graphql', 'gql'], ['graphql']],
	['docker', 'DK', '#2496ED', '#fff', [], ['dockerfile']],
	['vsix', 'EXT', '#8B7CF6', '#fff', ['vsix'], []],
];

const fileExtensions = {};
const languageIds = {};
for (const [id, label, bg, fg, exts, langIds] of langs) {
	def(id, badge(label, bg, fg));
	for (const e of exts) { fileExtensions[e] = id; }
	for (const l of langIds) { languageIds[l] = id; }
}

// ---- Special files ----
const fileNames = {};
const special = [
	['npm', 'NPM', '#CB3837', ['package.json', 'package-lock.json', '.npmrc']],
	['pnpm', 'PN', '#F69220', ['pnpm-lock.yaml', 'pnpm-workspace.yaml']],
	['tsconfig', 'TS', '#1E3A8A', ['tsconfig.json', 'jsconfig.json']],
	['git', 'GIT', '#F05033', ['.gitignore', '.gitattributes', '.gitmodules', '.git-blame-ignore-revs']],
	['readme', 'i', '#3B82F6', ['readme.md', 'readme', 'readme.txt']],
	['license', '©', '#A16207', ['license', 'license.md', 'license.txt', 'copying']],
	['dockerfile', 'DK', '#2496ED', ['dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'compose.yaml', '.dockerignore']],
	['eslint', 'ES', '#4B32C3', ['eslint.config.js', 'eslint.config.mjs', '.eslintrc', '.eslintrc.json', '.eslintrc.js']],
	['editorconfig', 'EC', '#4B5563', ['.editorconfig']],
	['nvmrc', 'N', '#3C873A', ['.nvmrc', '.node-version']],
	['claude', 'AI', '#D97757', ['claude.md', 'agents.md', 'copilot-instructions.md']],
	['horyzont', 'Z', '#8B7CF6', ['horyzont.md', 'product.json']],
	['vite', 'VT', '#646CFF', ['vite.config.ts', 'vite.config.js']],
	['makefile', 'MK', '#6D8086', ['makefile']],
];
for (const [id, label, bg, names] of special) {
	def(id, badge(label, bg));
	for (const n of names) { fileNames[n] = id; }
}

// ---- Special folders: [id, color, glyph, names] ----
const folderNames = {};
const folderNamesExpanded = {};
const folders = [
	['src', '#8B7CF6', '&lt;&gt;', ['src', 'source', 'lib']],
	['test', '#22C55E', '✓', ['test', 'tests', '__tests__', 'spec', 'e2e']],
	['build', '#F59E0B', '⚙', ['build', 'out', 'dist', '.build', 'target', 'bin']],
	['deps', '#64748B', '⬢', ['node_modules', 'vendor', '.pnpm']],
	['config', '#94A3B8', '⚙', ['.vscode', '.config', '.devcontainer', '.idea', '.claude', '.agents']],
	['github', '#6B7280', 'GH', ['.github', '.gitlab']],
	['docs', '#3B82F6', '¶', ['docs', 'doc', 'documentation']],
	['assets', '#EC4899', '★', ['assets', 'images', 'img', 'media', 'icons', 'public', 'static', 'resources']],
	['scripts', '#14B8A6', '$', ['scripts', 'tools', 'cli']],
	['ext', '#A855F7', '◆', ['extensions', 'plugins', 'packages']],
	['components', '#06B6D4', '◇', ['components', 'ui', 'widgets']],
];
for (const [id, color, glyph, names] of folders) {
	def(`folder-${id}`, folder(color, false, glyph));
	def(`folder-${id}-open`, folder(color, true, glyph));
	for (const n of names) {
		folderNames[n] = `folder-${id}`;
		folderNamesExpanded[n] = `folder-${id}-open`;
	}
}

const theme = {
	iconDefinitions: defs,
	file: 'file',
	folder: 'folder',
	folderExpanded: 'folder-open',
	rootFolder: 'root',
	rootFolderExpanded: 'root-open',
	fileExtensions,
	fileNames,
	languageIds,
	folderNames,
	folderNamesExpanded,
	hidesExplorerArrows: false
};
fs.writeFileSync(path.join(root, 'horyzont-icon-theme.json'), JSON.stringify(theme, null, '\t') + '\n');

fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
	name: 'theme-horyzont-icons',
	displayName: 'Horyzont Icons',
	description: 'Colorful badge-style file and folder icons for Horyzont.',
	version: '1.0.0',
	publisher: 'vscode',
	license: 'MIT',
	engines: { vscode: '*' },
	categories: ['Themes'],
	contributes: {
		iconThemes: [{ id: 'horyzont-icons', label: 'Horyzont Icons', path: './horyzont-icon-theme.json' }]
	}
}, null, 2) + '\n');

console.log(`Horyzont Icons: ${Object.keys(defs).length} icons written.`);
