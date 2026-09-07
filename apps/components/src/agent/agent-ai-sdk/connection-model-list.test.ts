import { describe, expect, it, vi } from 'vite-plus/test';
import { validateOpenAICompatibleConnection } from './connection-config';
import { listOpenAICompatibleModels, OpenAICompatibleModelListError } from './model-list';
import { toSafeAgentError } from './safe-error';

describe('OpenAI-compatible connection config', () => {
	it('accepts HTTP local tools, removes trailing slashes only, and never appends /v1', () => {
		const result = validateOpenAICompatibleConnection({
			apiKey: '',
			baseUrl: 'http://localhost:8080/openai///',
			model: 'example-model',
		});
		expect(result).toEqual({
			success: true,
			value: { apiKey: '', baseUrl: 'http://localhost:8080/openai', model: 'example-model' },
		});
	});

	it('rejects non-HTTP, embedded credentials, query secrets, blank models, and header injection', () => {
		for (const input of [
			{ baseUrl: 'ftp://example.com/v1', model: 'example-model' },
			{ baseUrl: 'https://user:secret@example.com/v1', model: 'example-model' },
			{ baseUrl: 'https://example.com/v1?key=secret', model: 'example-model' },
			{ baseUrl: 'https://example.com/v1', model: '' },
			{ baseUrl: 'https://example.com/v1', headers: { Example: 'value\r\nInjected: yes' }, model: 'example-model' },
		]) {
			expect(validateOpenAICompatibleConnection(input).success).toBe(false);
		}
	});

	it('bounds and redacts arbitrary runtime errors', () => {
		const error = toSafeAgentError(new Error(`Bearer private-key https://example.com/private ${'x'.repeat(500)}`), [
			'private-key',
		]);
		expect(error.message).not.toContain('private-key');
		expect(error.message).not.toContain('example.com/private');
		expect(error.message.length).toBeLessThanOrEqual(320);
	});
});

describe('listOpenAICompatibleModels', () => {
	it('validates an OpenAI list, de-duplicates IDs, and sends Authorization only for a non-empty key', async () => {
		const requests: Headers[] = [];
		const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
			requests.push(new Headers(init?.headers));
			return Response.json({
				object: 'list',
				data: [
					{ id: 'example-a', object: 'model', owned_by: 'example' },
					{ id: 'example-a', object: 'model' },
					{ id: 'example-b', object: 'model', created: 1 },
				],
			});
		});
		const withoutKey = await listOpenAICompatibleModels(
			{ apiKey: '   ', baseUrl: 'https://example.com/v1/', headers: { Authorization: 'Bearer ignored' } },
			{ fetch },
		);
		const withKey = await listOpenAICompatibleModels(
			{ apiKey: 'example-secret', baseUrl: 'https://example.com/v1/' },
			{ fetch },
		);
		expect(withoutKey.map((model) => model.id)).toEqual(['example-a', 'example-b']);
		expect(withKey).toHaveLength(2);
		expect(requests[0].has('Authorization')).toBe(false);
		expect(requests[1].get('Authorization')).toBe('Bearer example-secret');
		expect(fetch.mock.calls[0]?.[0]).toBe('https://example.com/v1/models');
	});

	it('returns fixed status, format, connection, and size errors without response or key leakage', async () => {
		await expect(
			listOpenAICompatibleModels(
				{ apiKey: 'private-key', baseUrl: 'https://example.com/v1' },
				{ fetch: async () => new Response('private-key details', { status: 401 }) },
			),
		).rejects.toMatchObject({ code: 'status', message: '模型列表请求失败（HTTP 401）。' });
		await expect(
			listOpenAICompatibleModels(
				{ apiKey: 'private-key', baseUrl: 'https://example.com/v1' },
				{ fetch: async () => Response.json({ data: [] }) },
			),
		).rejects.toMatchObject({ code: 'invalid-response' });
		await expect(
			listOpenAICompatibleModels(
				{ apiKey: 'private-key', baseUrl: 'https://example.com/v1' },
				{
					fetch: async () => {
						throw new Error('Bearer private-key');
					},
				},
			),
		).rejects.toEqual(new OpenAICompatibleModelListError('connection', '无法连接到模型服务。'));
		const aborted = new AbortController();
		aborted.abort();
		await expect(
			listOpenAICompatibleModels(
				{ baseUrl: 'https://example.com/v1' },
				{ fetch: async () => Response.json({ object: 'list', data: [] }), signal: aborted.signal },
			),
		).rejects.toMatchObject({ code: 'aborted' });
		await expect(
			listOpenAICompatibleModels(
				{ baseUrl: 'https://example.com/v1' },
				{
					fetch: async () => Response.json({ object: 'list', data: [{ id: 'x'.repeat(256), object: 'model' }] }),
					maxResponseBytes: 32,
				},
			),
		).rejects.toMatchObject({ code: 'response-too-large' });
	});
});
