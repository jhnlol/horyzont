// Horyzont dev helper: capture a PNG of the running Horyzont window via CDP.
// Usage: node build/horyzont/cdp-shot.mjs <port> <out.png> [x y width height scale]
import { writeFileSync } from 'fs';
const [port, out, x, y, width, height, scale] = process.argv.slice(2);
const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = targets.find(t => t.type === 'page' && t.url.includes('workbench') && (!process.env.HORYZONT_TITLE || t.title.includes(process.env.HORYZONT_TITLE)));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
const params = { format: 'png' };
if (width) {
	params.clip = { x: Number(x), y: Number(y), width: Number(width), height: Number(height), scale: Number(scale ?? 1) };
}
ws.send(JSON.stringify({ id: 1, method: 'Page.captureScreenshot', params }));
ws.addEventListener('message', e => {
	const msg = JSON.parse(e.data);
	if (msg.id === 1) {
		writeFileSync(out, Buffer.from(msg.result.data, 'base64'));
		console.log('saved', out);
		ws.close();
		process.exit(0);
	}
});
