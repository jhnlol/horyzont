// Horyzont: renders the logo SVG to PNG/ICO app icons using a running Horyzont window (CDP canvas).
// Usage: node build/horyzont/mkappicon.mjs <cdpPort>
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const port = process.argv[2] ?? '9333';
const svg = readFileSync(join(root, 'src/vs/workbench/browser/media/code-icon.svg'), 'utf8');

const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = targets.find(t => t.type === 'page' && t.url.includes('workbench'));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));

const sizes = [16, 24, 32, 48, 64, 70, 128, 150, 256, 512, 1024];
const expression = `(async () => {
	const img = new Image();
	img.src = 'data:image/svg+xml;base64,' + ${JSON.stringify(Buffer.from(svg).toString('base64'))};
	await img.decode();
	const out = {};
	for (const s of ${JSON.stringify(sizes)}) {
		const c = document.createElement('canvas'); c.width = s; c.height = s;
		c.getContext('2d').drawImage(img, 0, 0, s, s);
		out[s] = c.toDataURL('image/png').split(',')[1];
	}
	return out;
})()`;
ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } }));
const pngs = await new Promise(resolve => ws.addEventListener('message', e => {
	const m = JSON.parse(e.data);
	if (m.id === 1) { resolve(m.result.result.value); }
}));
ws.close();

const png = s => Buffer.from(pngs[s], 'base64');

// ICO container with embedded PNG images
function ico(list) {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(list.length, 4);
	const entries = []; const datas = [];
	let offset = 6 + 16 * list.length;
	for (const s of list) {
		const data = png(s);
		const e = Buffer.alloc(16);
		e.writeUInt8(s >= 256 ? 0 : s, 0); e.writeUInt8(s >= 256 ? 0 : s, 1);
		e.writeUInt8(0, 2); e.writeUInt8(0, 3);
		e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
		e.writeUInt32LE(data.length, 8); e.writeUInt32LE(offset, 12);
		offset += data.length;
		entries.push(e); datas.push(data);
	}
	return Buffer.concat([header, ...entries, ...datas]);
}

writeFileSync(join(root, 'resources/win32/code.ico'), ico([16, 24, 32, 48, 64, 128, 256]));
writeFileSync(join(root, 'resources/win32/code_150x150.png'), png(150));
writeFileSync(join(root, 'resources/win32/code_70x70.png'), png(70));
writeFileSync(join(root, 'resources/linux/code.png'), png(512));

// ICNS container with embedded PNG images (macOS 10.7+)
function icns(list) {
	const chunks = list.map(([type, size]) => {
		const data = png(size);
		const head = Buffer.alloc(8);
		head.write(type, 0, 'ascii');
		head.writeUInt32BE(data.length + 8, 4);
		return Buffer.concat([head, data]);
	});
	const body = Buffer.concat(chunks);
	const head = Buffer.alloc(8);
	head.write('icns', 0, 'ascii');
	head.writeUInt32BE(body.length + 8, 4);
	return Buffer.concat([head, body]);
}
writeFileSync(join(root, 'resources/darwin/code.icns'), icns([['icp4', 16], ['icp5', 32], ['icp6', 64], ['ic07', 128], ['ic08', 256], ['ic09', 512], ['ic10', 1024], ['ic11', 32], ['ic12', 64], ['ic13', 256], ['ic14', 512]]));
console.log('Horyzont app icons written.');
process.exit(0);
