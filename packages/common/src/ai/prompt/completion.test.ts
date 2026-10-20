import { describe, expect, it } from 'vitest';
import { executePrompt, type PromptProtocol, type PromptRequest } from './index';

const request: PromptRequest = {
	target: { api: 'openai', baseUrl: 'https://example.com' },
	model: 'fixture',
	messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }],
	stream: true,
};
const fetchResponse =
	(response: Response): typeof fetch =>
	async () =>
		response;
const sse = (frames: unknown[], suffix = '') =>
	new Response(frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join('') + suffix, {
		headers: { 'content-type': 'text/event-stream' },
	});

describe('prompt completion integrity', () => {
	it('keeps abort identity when JSON consumption rejects during cancellation', async () => {
		const signal = new AbortController();
		const response = Response.json({});
		response.json = async () => {
			signal.abort();
			throw new DOMException('fixture', 'AbortError');
		};
		await expect(
			executePrompt({ ...request, stream: false }, { signal: signal.signal, fetch: fetchResponse(response) }),
		).rejects.toMatchObject({ name: 'AbortError' });
	});
	it.each<PromptProtocol>(['openai', 'openai-response', 'anthropic', 'gemini'])(
		'rejects interrupted %s streams',
		async (api) => {
			const partial =
				api === 'openai'
					? { choices: [{ index: 0, delta: { content: 'partial' }, finish_reason: null }] }
					: api === 'openai-response'
						? { type: 'response.output_text.delta', output_index: 0, content_index: 0, delta: 'partial' }
						: api === 'anthropic'
							? { type: 'content_block_start', index: 0, content_block: { type: 'text', text: 'partial' } }
							: { candidates: [{ index: 0, content: { role: 'model', parts: [{ text: 'partial' }] } }] };
			await expect(
				executePrompt(
					{ ...request, target: { ...request.target, api }, maxOutputTokens: 32 },
					{ fetch: fetchResponse(sse([partial])) },
				),
			).rejects.toThrow('before completion');
		},
	);
	it('rejects HTML, empty events and invalid JSON responses rather than returning empty success', async () => {
		await expect(
			executePrompt(request, {
				fetch: fetchResponse(new Response('<html>fixture</html>', { headers: { 'content-type': 'text/html' } })),
			}),
		).rejects.toThrow('content type');
		await expect(executePrompt(request, { fetch: fetchResponse(sse([])) })).rejects.toThrow('before completion');
		await expect(
			executePrompt({ ...request, stream: false }, { fetch: fetchResponse(Response.json({})) }),
		).rejects.toThrow('no choices');
	});
	it('accepts a DONE marker and preserves usage trailers after finish events', async () => {
		const result = await executePrompt(request, {
			fetch: fetchResponse(
				sse(
					[
						{ choices: [{ index: 0, delta: { content: 'complete' }, finish_reason: 'stop' }] },
						{ choices: [], usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 } },
					],
					'data: [DONE]\n\n',
				),
			),
		});
		expect(result.text).toBe('complete');
		expect(result.usage?.totalTokens).toBe(5);
	});
});
