import { describe, expect, it } from 'vitest';
import { executePrompt, type PromptRequest } from './index';

const request: PromptRequest = {
	target: { api: 'openai', baseUrl: 'https://example.com', apiKey: 'fixture-key' },
	model: 'fixture',
	messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }],
};
const encoder = new TextEncoder();
const fetchResponse =
	(response: Response): typeof fetch =>
	async () =>
		response;
function stream(frames: unknown[]) {
	return new Response(frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join(''), {
		headers: { 'content-type': 'text/event-stream' },
	});
}

describe('prompt error and stream boundaries', () => {
	it('does not surface provider bodies, credentials or low-level network error messages', async () => {
		await expect(
			executePrompt(request, {
				fetch: fetchResponse(Response.json({ error: { message: 'fixture-key' } }, { status: 401 })),
			}),
		).rejects.toThrow('HTTP 401');
		const fetch: typeof globalThis.fetch = async () => {
			throw new Error('fixture-key https://example.com?token=private');
		};
		await expect(executePrompt(request, { fetch })).rejects.toThrow(/^Prompt request failed$/);
	});
	it('rejects cancellation that happens during JSON consumption even if the host fetch ignores signals', async () => {
		const controller = new AbortController();
		const response = Response.json({ choices: [{ message: { role: 'assistant', content: 'unused' } }] });
		const json = response.json.bind(response);
		response.json = async () => {
			controller.abort();
			return json();
		};
		await expect(
			executePrompt(request, { signal: controller.signal, fetch: fetchResponse(response) }),
		).rejects.toMatchObject({ name: 'AbortError' });
	});
	it('streams only the selected first choice while preserving all aggregated choices', async () => {
		const output: string[] = [];
		const response = await executePrompt(
			{ ...request, stream: true },
			{
				fetch: fetchResponse(
					stream([
						{
							id: 'fixture',
							choices: [
								{ index: 0, delta: { role: 'assistant', content: 'first' }, finish_reason: 'stop' },
								{ index: 1, delta: { role: 'assistant', content: 'second' }, finish_reason: 'stop' },
							],
						},
					]),
				),
				onText: (text) => {
					output.push(text);
				},
			},
		);
		expect(output.join('')).toBe('first');
		expect(response.text).toBe('first');
		expect(response.response.choices).toHaveLength(2);
	});
	it('retains Anthropic input usage when later events provide output usage only', async () => {
		const response = await executePrompt(
			{ ...request, stream: true, maxOutputTokens: 32, target: { api: 'anthropic', baseUrl: 'https://example.com' } },
			{
				fetch: fetchResponse(
					stream([
						{
							type: 'message_start',
							message: {
								id: 'fixture',
								type: 'message',
								model: 'fixture',
								role: 'assistant',
								content: [],
								usage: { input_tokens: 2, output_tokens: 0 },
							},
						},
						{ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 3 } },
						{ type: 'message_stop' },
					]),
				),
			},
		);
		expect(response.usage).toMatchObject({ inputTokens: 2, outputTokens: 3 });
	});
	it('cancels the reader when malformed stream data fails decoding', async () => {
		let cancelled = false;
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(encoder.encode('data: invalid-fixture-key\n\n'));
			},
			cancel() {
				cancelled = true;
			},
		});
		await expect(
			executePrompt({ ...request, stream: true }, { fetch: fetchResponse(new Response(body)) }),
		).rejects.toThrow(/^Prompt provider returned invalid stream data$/);
		expect(cancelled).toBe(true);
	});
});
