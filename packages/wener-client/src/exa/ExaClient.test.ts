import { describe, expect, it } from 'vite-plus/test';
import { ExaClient, type ExaClientError } from './index';

describe('ExaClient', () => {
	it('sends search requests to the Exa search endpoint with x-api-key', async () => {
		const calls: Array<{ url: string; init: RequestInit; body: unknown }> = [];
		const client = new ExaClient({
			apiKey: 'test-key',
			baseUrl: 'https://api.example.test',
			fetch: async (input, init = {}) => {
				const body = typeof init.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined;
				calls.push({ url: String(input), init, body });
				return new Response(
					JSON.stringify({ requestId: 'req_1', results: [{ title: 'Hello', url: 'https://example.test' }] }),
					{
						status: 200,
						headers: { 'content-type': 'application/json' },
					},
				);
			},
		});

		const response = await client.search('hello world', {
			type: 'auto',
			numResults: 3,
			contents: { highlights: true },
		});

		expect(response.results[0]?.url).toBe('https://example.test');
		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe('https://api.example.test/search');
		expect(calls[0]?.init.method).toBe('POST');
		expect(new Headers(calls[0]?.init.headers).get('x-api-key')).toBe('test-key');
		expect(calls[0]?.body).toEqual({
			query: 'hello world',
			type: 'auto',
			numResults: 3,
			contents: { highlights: true },
		});
	});

	it('sends contents requests to the Exa contents endpoint', async () => {
		const calls: Array<{ url: string; init: RequestInit; body: unknown }> = [];
		const client = new ExaClient({
			apiKey: 'test-key',
			baseUrl: 'https://api.example.test',
			fetch: async (input, init = {}) => {
				const body = typeof init.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined;
				calls.push({ url: String(input), init, body });
				return new Response(
					JSON.stringify({
						requestId: 'req_contents',
						results: [{ title: 'Doc', url: 'https://example.test/doc', text: '# Doc' }],
					}),
					{
						status: 200,
						headers: { 'content-type': 'application/json' },
					},
				);
			},
		});

		const response = await client.contents(['https://example.test/doc'], { text: true, maxAgeHours: 0 });

		expect(response.results[0]?.text).toBe('# Doc');
		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe('https://api.example.test/contents');
		expect(calls[0]?.init.method).toBe('POST');
		expect(new Headers(calls[0]?.init.headers).get('x-api-key')).toBe('test-key');
		expect(calls[0]?.body).toEqual({ urls: ['https://example.test/doc'], text: true, maxAgeHours: 0 });
	});

	it('throws ExaClientError with response details', async () => {
		const client = new ExaClient({
			apiKey: 'test-key',
			fetch: async () =>
				new Response(JSON.stringify({ error: 'bad request' }), {
					status: 400,
					statusText: 'Bad Request',
					headers: { 'content-type': 'application/json' },
				}),
		});

		await expect(client.search('bad')).rejects.toMatchObject({
			name: 'ExaClientError',
			status: 400,
			message: expect.stringContaining('bad request'),
		} satisfies Partial<ExaClientError>);
	});
});
