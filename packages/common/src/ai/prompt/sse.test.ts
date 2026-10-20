import { expect, it } from 'vitest';
import { readSse } from './sse';

it.each(['\n', '\r', '\r\n'])('reads byte-fragmented UTF-8 SSE with %j line endings', async (newline) => {
	const text = [
		`event: discarded`,
		'',
		`event: token`,
		`data: {"text":"你好 🌏"}`,
		'',
		': comment',
		'data: final',
		'',
		'',
	].join(newline);
	const bytes = new TextEncoder().encode(text);
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
			controller.close();
		},
	});
	const events = [];
	for await (const event of readSse(stream)) events.push(event);
	expect(events).toEqual([{ event: 'token', data: '{"text":"你好 🌏"}' }, { data: 'final' }]);
});
