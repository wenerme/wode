import { describe, expect, it } from 'vitest';
import type { ChatConfig } from '../server/schema';
import { createChatHandler } from './handler';

describe('Chat Handler', () => {
	const config: ChatConfig = {
		models: [
			{
				name: 'test-model',
				baseUrl: 'http://127.0.0.1:31235',
				adapter: 'openai',
			},
			{
				name: 'qwen*',
				baseUrl: 'http://127.0.0.1:31235',
				adapter: 'openai',
			},
		],
	};

	const app = createChatHandler({ config });

	describe('models endpoint', () => {
		it('should list configured models', async () => {
			const res = await app.request('/v1/models');
			expect(res.status).toBe(200);

			const data = await res.json();
			expect(data.object).toBe('list');
			expect(data.data).toHaveLength(2);
			expect(data.data.map((m: any) => m.id)).toContain('test-model');
			expect(data.data.map((m: any) => m.id)).toContain('qwen*');
		});
	});

	describe('chat completions validation', () => {
		it('should reject requests without model', async () => {
			const res = await app.request('/v1/chat/completions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: [{ role: 'user', content: 'Hello' }],
				}),
			});
			expect(res.status).toBe(400);
		});

		it('should reject requests without messages', async () => {
			const res = await app.request('/v1/chat/completions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: 'test-model',
				}),
			});
			expect(res.status).toBe(400);
		});

		it('should reject unconfigured model', async () => {
			const res = await app.request('/v1/chat/completions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: 'unknown-model',
					messages: [{ role: 'user', content: 'Hello' }],
				}),
			});
			expect(res.status).toBe(404);

			const data = await res.json();
			expect(data.error.code).toBe('model_not_found');
		});

		it('should match wildcard model patterns', async () => {
			// This will fail at upstream request, but it should pass model resolution
			const res = await app.request('/v1/chat/completions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: 'qwen3-vl-8b-instruct',
					messages: [{ role: 'user', content: 'Hello' }],
				}),
			});
			// Should not be 404 (model found), but might be 500 (upstream error in test env)
			expect(res.status).not.toBe(404);
		});
	});

	describe('anthropic messages validation', () => {
		it('should reject requests without required fields', async () => {
			const res = await app.request('/v1/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: 'test-model',
					messages: [{ role: 'user', content: 'Hello' }],
					// missing max_tokens
				}),
			});
			expect(res.status).toBe(400);
		});
	});
});

// Integration tests that require network access
describe.skip('Chat Handler Integration', () => {
	const config: ChatConfig = {
		models: [
			{
				name: 'qwen*',
				baseUrl: 'http://127.0.0.1:31235',
				adapter: 'openai',
			},
		],
	};

	const app = createChatHandler({ config });

	it('should complete chat with local model', async () => {
		const res = await app.request('/v1/chat/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'qwen3-vl-8b-instruct',
				messages: [{ role: 'user', content: 'Say hello in one word' }],
				max_tokens: 50,
			}),
		});

		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.object).toBe('chat.completion');
		expect(data.choices).toHaveLength(1);
		expect(data.choices[0].message.role).toBe('assistant');
		expect(data.choices[0].message.content).toBeTruthy();
	}, 30000);
});
