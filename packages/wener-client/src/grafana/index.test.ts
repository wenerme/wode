import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { GrafanaClient } from './index';

function response(value: unknown, init?: ResponseInit): Response {
	return Response.json(value, init);
}
function client(fetch: FetchLike, options: Partial<ConstructorParameters<typeof GrafanaClient>[0]> = {}) {
	return new GrafanaClient({ baseUrl: 'https://grafana.example.test/', fetch, ...options });
}

describe('GrafanaClient', () => {
	it('checks health via GET /api/health', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ database: 'ok', version: '11.0.0' }));
		const test = client(fetch);
		const result = await test.health();
		expect(result).toEqual({ database: 'ok', version: '11.0.0' });
		const [url, init] = fetch.mock.calls[0]!;
		expect(new URL(url.toString()).pathname).toBe('/api/health');
		expect(init?.method).toBe('GET');
		await test.close();
	});

	it('reads the current user via GET /api/user', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ login: 'admin', email: 'admin@example.test' }));
		const test = client(fetch, { accessToken: 'fixture-token' });
		const result = await test.whoAmI();
		expect(result).toEqual({ login: 'admin', email: 'admin@example.test' });
		const [url, init] = fetch.mock.calls[0]!;
		expect(new URL(url.toString()).pathname).toBe('/api/user');
		expect(new Headers(init?.headers).get('authorization')).toBe('Bearer fixture-token');
		await test.close();
	});

	it('passes through a generic GET request with query parameters', async () => {
		const fetch = vi.fn<FetchLike>(async () => response([{ id: 1, title: 'Dashboard' }]));
		const test = client(fetch);
		const result = await test.request({ path: '/api/search', params: { type: 'dash-db', tag: ['a', 'b'] } });
		expect(result).toEqual([{ id: 1, title: 'Dashboard' }]);
		const url = new URL(fetch.mock.calls[0]![0].toString());
		expect(url.pathname).toBe('/api/search');
		expect(url.searchParams.get('type')).toBe('dash-db');
		expect(url.searchParams.getAll('tag')).toEqual(['a', 'b']);
		await test.close();
	});

	it('passes through a write request with a JSON body', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ id: 1, status: 'success' }));
		const test = client(fetch);
		const result = await test.request({ path: '/api/dashboards/db', method: 'POST', body: { dashboard: { title: 'New' } } });
		expect(result).toEqual({ id: 1, status: 'success' });
		const [, init] = fetch.mock.calls[0]!;
		expect(init?.method).toBe('POST');
		expect(JSON.parse(init?.body as string)).toEqual({ dashboard: { title: 'New' } });
		expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
		await test.close();
	});

	it('rejects unsafe paths and GET requests with a body', async () => {
		const test = client(vi.fn<FetchLike>());
		await expect(test.request({ path: '/api/../secrets' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(test.request({ path: '/api/health', method: 'GET', body: { a: 1 } })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
	});

	it('supports bearer, basic and custom header authentication', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ ok: true }));
		await client(fetch, { accessToken: 'fixture-token' }).health();
		expect(new Headers(fetch.mock.calls[0]![1]?.headers).get('authorization')).toBe('Bearer fixture-token');
		await client(fetch, { username: 'fixture-user', password: 'fixture-password' }).health();
		expect(new Headers(fetch.mock.calls[1]![1]?.headers).get('authorization')).toMatch(/^Basic /u);
		await client(fetch, { headers: { 'x-api-key': 'fixture-header' } }).health();
		expect(new Headers(fetch.mock.calls[2]![1]?.headers).get('x-api-key')).toBe('fixture-header');
	});

	it('uses fixed summaries for HTTP errors', async () => {
		const http = client(vi.fn<FetchLike>(async () => response({ message: 'PRIVATE_SERVER_ERROR' }, { status: 500 })));
		await expect(http.health()).rejects.toMatchObject({ code: 'REQUEST_FAILED', message: 'Grafana health request failed' });
		const auth = client(vi.fn<FetchLike>(async () => response({ message: 'unauthorized' }, { status: 401 })));
		await expect(auth.whoAmI()).rejects.toMatchObject({ code: 'AUTH_FAILED' });
	});

	it('handles timeout, cancellation and close', async () => {
		let resolve!: (value: Response) => void;
		const pending = vi.fn<FetchLike>((_url, init) => new Promise<Response>((res) => {
			resolve = res;
			init?.signal?.addEventListener('abort', () => undefined);
		}));
		const test = client(pending, { timeoutMs: 10 });
		await expect(test.health()).rejects.toMatchObject({ code: 'TIMEOUT' });
		const controller = new AbortController();
		const aborted = test.health({ signal: controller.signal });
		controller.abort();
		await expect(aborted).rejects.toMatchObject({ code: 'ABORTED' });
		const closing = test.health();
		await test.close();
		await expect(closing).rejects.toMatchObject({ code: 'CLOSED' });
		await expect(test.health()).rejects.toMatchObject({ code: 'CLOSED' });
		resolve(response({ ok: true }));
	});
});
