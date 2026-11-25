// Horyzont dev helper: evaluate a JS expression in the running Horyzont window via CDP.
// Usage: node build/horyzont/cdp-eval.mjs <port> "<expression>"
const [port, expression] = process.argv.slice(2);
const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = targets.find(t => t.type === 'page' && t.url.includes('workbench') && (!process.env.HORYZONT_TITLE || t.title.includes(process.env.HORYZONT_TITLE)));
if (!page) {
	console.error('No workbench page', targets.map(t => t.url));
	process.exit(1);
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } }));
ws.addEventListener('message', e => {
	const msg = JSON.parse(e.data);
	if (msg.id === 1) {
		const r = msg.result?.result;
		console.log(typeof r?.value === 'string' ? r.value : JSON.stringify(r?.value ?? msg.result, null, 1));
		ws.close();
		process.exit(0);
	}
});
