import { describe, expect, it } from 'vite-plus/test';
import { HonchoClient, type HonchoClientError, normalizeHonchoEndpoint, normalizeHonchoPage } from './index';

describe('HonchoClient', () => {
	it('sends authenticated v3 requests with query and JSON body', async () => {
		const calls: Array<{ url: string; method?: string; headers: Headers; body?: unknown }> = [];
		const client = new HonchoClient({
			apiKey: 'honcho-secret',
			baseUrl: 'https://honcho.test/root',
			fetch: async (input, init = {}) => {
				calls.push({
					url: String(input),
					method: init.method,
					headers: new Headers(init.headers),
					body: typeof init.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined,
				});
				return new Response(JSON.stringify({ items: [{ id: 'w1' }], total: 1 }), {
					status: 200,
					headers: { 'content-type': 'application/json' },
				});
			},
		});

		const response = await client.listWorkspaces({ size: 2, filters: { name: 'demo' } });

		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe('https://honcho.test/root/v3/workspaces/list?size=2');
		expect(calls[0]?.method).toBe('POST');
		expect(calls[0]?.headers.get('authorization')).toBe('Bearer honcho-secret');
		expect(calls[0]?.headers.get('content-type')).toBe('application/json');
		expect(calls[0]?.body).toEqual({ filters: { name: 'demo' } });
		expect(response).toEqual({ items: [{ id: 'w1' }], total: 1 });
	});

	it('normalizes base URLs that already include /v3', async () => {
		expect(normalizeHonchoEndpoint('https://honcho.test/v3')).toEqual({
			baseUrl: 'https://honcho.test',
			apiPrefix: '/v3',
		});
		expect(normalizeHonchoEndpoint('https://honcho.test/root/v3')).toEqual({
			baseUrl: 'https://honcho.test/root',
			apiPrefix: '/v3',
		});

		const calls: string[] = [];
		const client = new HonchoClient({
			baseUrl: 'https://honcho.test/root/v3',
			fetch: async (input) => {
				calls.push(String(input));
				return new Response(JSON.stringify({ total_work_units: 1 }), {
					status: 200,
					headers: { 'content-type': 'application/json' },
				});
			},
		});

		await client.getQueueStatus('workspace 1');

		expect(calls).toEqual(['https://honcho.test/root/v3/workspaces/workspace%201/queue/status']);
	});

	it('exposes typed memory helpers', async () => {
		const calls: Array<{ url: string; body?: unknown }> = [];
		const client = new HonchoClient({
			baseUrl: 'https://honcho.test',
			fetch: async (input, init = {}) => {
				calls.push({
					url: String(input),
					body: typeof init.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined,
				});
				return new Response(JSON.stringify([{ id: 'c1', content: 'Wener likes WCLI' }]), {
					status: 200,
					headers: { 'content-type': 'application/json' },
				});
			},
		});

		const response = await client.queryConclusions('workspace 1', {
			query: 'wcli',
			top_k: 3,
			filters: { observer_id: 'wener' },
		});

		expect(calls[0]?.url).toBe('https://honcho.test/v3/workspaces/workspace%201/conclusions/query');
		expect(calls[0]?.body).toEqual({ query: 'wcli', top_k: 3, filters: { observer_id: 'wener' } });
		expect(response[0]).toMatchObject({ id: 'c1', content: 'Wener likes WCLI' });
	});

	it('normalizes page responses', () => {
		expect(normalizeHonchoPage({ items: [{ id: 'a' }], total: 1 })).toEqual([{ id: 'a' }]);
		expect(normalizeHonchoPage([{ id: 'b' }])).toEqual([{ id: 'b' }]);
		expect(normalizeHonchoPage(undefined)).toEqual([]);
	});

	it('throws HonchoClientError with response details', async () => {
		const client = new HonchoClient({
			fetch: async () =>
				new Response(JSON.stringify({ detail: 'bad token' }), { status: 401, statusText: 'Unauthorized' }),
		});

		await expect(client.getQueueStatus('w1')).rejects.toMatchObject({
			name: 'HonchoClientError',
			status: 401,
			message: expect.stringContaining('bad token'),
		} satisfies Partial<HonchoClientError>);
	});
});
