import type { UIMessage, UIMessageChunk } from 'ai';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createOpenAICompatibleDirectTransport } from './direct-transport';
import { resolveOpenAICompatibleDirectTransportLimits } from './direct-transport-limits';

const userMessage: UIMessage = {
	id: 'user-1',
	role: 'user',
	parts: [{ type: 'text', text: '你好' }],
};

const streamBody = [
	'data: {"id":"chatcmpl-example","object":"chat.completion.chunk","created":1,"model":"example-model","choices":[{"index":0,"delta":{"role":"assistant","content":"你好"},"finish_reason":null}]}',
	'',
	'data: {"id":"chatcmpl-example","object":"chat.completion.chunk","created":1,"model":"example-model","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}}',
	'',
	'data: [DONE]',
	'',
].join('\n');

describe('createOpenAICompatibleDirectTransport', () => {
	it('streams through ToolLoopAgent and DirectChatTransport with an injected compatible fetch', async () => {
		const fetch = vi.fn(
			async (_input: RequestInfo | URL, _init?: RequestInit) =>
				new Response(streamBody, { headers: { 'content-type': 'text/event-stream' } }),
		);
		const transport = createOpenAICompatibleDirectTransport({
			connection: { apiKey: 'example-key', baseUrl: 'https://example.com/v1', model: 'example-model' },
			fetch,
			instructions: '简洁回答。',
			maxSteps: 2,
		});
		const stream = await transport.sendMessages({
			abortSignal: undefined,
			chatId: 'chat-1',
			messageId: undefined,
			messages: [userMessage],
			trigger: 'submit-message',
		});
		const chunks = await readChunks(stream);
		expect(chunks.some((chunk) => chunk.type === 'text-delta' && 'delta' in chunk && chunk.delta === '你好')).toBe(
			true,
		);
		expect(fetch).toHaveBeenCalledOnce();
		expect(fetch.mock.calls[0]?.[0]).toBe('https://example.com/v1/chat/completions');
		const headers = new Headers(fetch.mock.calls[0]?.[1]?.headers);
		expect(headers.get('Authorization')).toBe('Bearer example-key');
		const requestBody = JSON.parse(String(fetch.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
		expect(requestBody.max_tokens).toBe(8_192);
	});

	it('applies lower runtime budgets within fixed ceilings', () => {
		const limits = resolveOpenAICompatibleDirectTransportLimits({
			maxOutputTokens: 512,
			maxResponseBytes: 1_024,
			maxResponseChunks: 10,
			maxRetries: 0,
			maxStreamChunks: 20,
			maxStreamProjectionBytes: 2_048,
			timeout: { chunkMs: 1_000, stepMs: 2_000, toolMs: 3_000, totalMs: 4_000 },
		});
		expect(limits).toMatchObject({
			maxOutputTokens: 512,
			maxRetries: 0,
			timeout: { chunkMs: 1_000, stepMs: 2_000, toolMs: 3_000, totalMs: 4_000 },
		});
		expect(() => resolveOpenAICompatibleDirectTransportLimits({ maxOutputTokens: 8_193 })).toThrow(/maxOutputTokens/u);
		expect(() => resolveOpenAICompatibleDirectTransportLimits({ timeout: { totalMs: 120_001 } })).toThrow(
			/timeout\.totalMs/u,
		);
	});

	it('fails before SDK parsing when the aggregate provider response exceeds its byte budget', async () => {
		const fetch = vi.fn(async () => new Response(streamBody));
		const transport = createOpenAICompatibleDirectTransport({
			connection: { apiKey: 'budget-secret', baseUrl: 'https://example.com/v1', model: 'example-model' },
			fetch,
			limits: { maxResponseBytes: 64, maxRetries: 0 },
		});
		const stream = await transport.sendMessages({
			abortSignal: undefined,
			chatId: 'chat-budget',
			messageId: undefined,
			messages: [userMessage],
			trigger: 'submit-message',
		});
		let failure: unknown;
		try {
			await readChunks(stream);
		} catch (error) {
			failure = error;
		}
		expect(fetch).toHaveBeenCalledOnce();
		expect(failure).toBeInstanceOf(Error);
		expect((failure as Error).message).toContain('模型响应超过客户端安全限制');
		expect((failure as Error).message).not.toContain('budget-secret');
	});

	it('bounds projected UI stream event count and aggregate content', async () => {
		const fetch = vi.fn(async () => new Response(streamBody, { headers: { 'content-type': 'text/event-stream' } }));
		const connection = { baseUrl: 'https://example.com/v1', model: 'example-model' };
		const countTransport = createOpenAICompatibleDirectTransport({
			connection,
			fetch,
			limits: { maxRetries: 0, maxStreamChunks: 1 },
		});
		const countFailure = await readFailure(
			await countTransport.sendMessages({
				abortSignal: undefined,
				chatId: 'chat-count',
				messageId: undefined,
				messages: [userMessage],
				trigger: 'submit-message',
			}),
		);
		expect(countFailure.message).toContain('模型输出事件数量超过客户端安全限制');

		const projectionTransport = createOpenAICompatibleDirectTransport({
			connection,
			fetch,
			limits: { maxRetries: 0, maxStreamProjectionBytes: 16 },
		});
		const projectionFailure = await readFailure(
			await projectionTransport.sendMessages({
				abortSignal: undefined,
				chatId: 'chat-projection',
				messageId: undefined,
				messages: [userMessage],
				trigger: 'submit-message',
			}),
		);
		expect(projectionFailure.message).toContain('模型输出内容超过客户端安全限制');
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('redacts API keys and endpoints from errors thrown by injected fetch', async () => {
		const transport = createOpenAICompatibleDirectTransport({
			connection: { apiKey: 'private-key', baseUrl: 'https://example.com/v1', model: 'example-model' },
			fetch: async () => {
				throw new Error('Bearer private-key failed at https://example.com/v1');
			},
		});
		const stream = await transport.sendMessages({
			abortSignal: undefined,
			chatId: 'chat-1',
			messageId: undefined,
			messages: [userMessage],
			trigger: 'submit-message',
		});
		const chunks = await readChunks(stream);
		const serialized = JSON.stringify(chunks);
		expect(chunks).toContainEqual(expect.objectContaining({ type: 'error' }));
		expect(serialized).not.toMatch(/private-key|example\.com/iu);
		expect(serialized).toContain('[已隐藏]');
	});
});

async function readFailure(stream: ReadableStream<UIMessageChunk>): Promise<Error> {
	try {
		await readChunks(stream);
	} catch (error) {
		if (error instanceof Error) return error;
	}
	throw new Error('expected stream failure');
}

async function readChunks(stream: ReadableStream<UIMessageChunk>) {
	const chunks: UIMessageChunk[] = [];
	const reader = stream.getReader();
	while (true) {
		const result = await reader.read();
		if (result.done) return chunks;
		chunks.push(result.value);
	}
}
