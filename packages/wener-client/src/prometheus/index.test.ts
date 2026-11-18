import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { PrometheusClient } from './index';

function response(value: unknown, init?: ResponseInit): Response {
	return Response.json(value, init);
}
function client(fetch: FetchLike, options: Partial<ConstructorParameters<typeof PrometheusClient>[0]> = {}) {
	return new PrometheusClient({ baseUrl: 'https://metrics.example.test/root/', fetch, ...options });
}

describe('PrometheusClient', () => {
	it('encodes query parameters and parses all Prometheus result types', async () => {
		const fetch = vi.fn<FetchLike>(async (url) => {
			const query = new URL(url.toString()).searchParams.get('query');
			const resultType = query?.includes('scalar') ? 'scalar' : query?.includes('string') ? 'string' : query?.includes('vector') ? 'vector' : 'matrix';
			const result = resultType === 'scalar' || resultType === 'string'
				? [1, '2']
				: resultType === 'vector' ? [{ metric: { __name__: 'http_requests_total' }, value: [1, '2'] }] : [{ metric: { job: 'api' }, values: [[1, '2']] }];
			return response({ status: 'success', data: { resultType, result }, warnings: ['fixture warning'] });
		});
		const test = client(fetch);
		for (const type of ['scalar', 'string', 'vector', 'matrix']) {
			const result = await test.query({ query: `${type} metric{label="a&b"}` });
			expect(result.data.resultType).toBe(type);
			expect(result.warnings).toEqual(['fixture warning']);
		}
		const url = new URL(fetch.mock.calls[0]![0].toString());
		expect(url.pathname).toBe('/root/api/v1/query');
		expect(url.search).toContain('query=');
		expect(url.searchParams.get('query')).toContain('label="a&b"');
		await test.queryRange({ query: 'up{job="api"}', start: 'now-1h', end: 'now', step: 60 });
		const rangeUrl = new URL(fetch.mock.calls[4]![0].toString());
		expect(rangeUrl.pathname).toBe('/root/api/v1/query_range');
		expect(rangeUrl.searchParams.get('query')).toBe('up{job="api"}');
		expect(rangeUrl.searchParams.get('start')).toBe('now-1h');
		expect(rangeUrl.searchParams.get('step')).toBe('60');
		await test.close();
	});

	it('supports series, labels, label values and metadata envelopes', async () => {
		const fetch = vi.fn<FetchLike>(async (url) => {
			const path = new URL(url.toString()).pathname;
			if (path.endsWith('/series')) return response({ status: 'success', data: [{ job: 'api' }] });
			if (path.endsWith('/labels')) return response({ status: 'success', data: ['job', 'instance'] });
			if (path.endsWith('/values')) return response({ status: 'success', data: ['api'] });
			return response({ status: 'success', data: { http_requests_total: [{ type: 'counter', help: 'requests', unit: '' }] } });
		});
		const test = client(fetch);
		expect((await test.series({ match: ['{job="api"}', '{job="worker"}'] })).data).toEqual([{ job: 'api' }]);
		expect((await test.labels({ match: ['{job="api"}'] })).data).toEqual(['job', 'instance']);
		expect((await test.labelValues({ label: 'job/name', match: ['{job="api"}'] })).data).toEqual(['api']);
		expect((await test.metadata({ metric: 'http_requests_total', limit: 2 })).data.http_requests_total[0]?.type).toBe('counter');
		expect(new URL(fetch.mock.calls[2]![0].toString()).pathname).toBe('/root/api/v1/label/job%2Fname/values');
		expect(new URL(fetch.mock.calls[0]![0].toString()).searchParams.getAll('match[]')).toEqual(['{job="api"}', '{job="worker"}']);
		expect(new URL(fetch.mock.calls[1]![0].toString()).searchParams.getAll('match[]')).toEqual(['{job="api"}']);
		expect(new URL(fetch.mock.calls[2]![0].toString()).searchParams.getAll('match[]')).toEqual(['{job="api"}']);
		await test.close();
	});

	it('supports bearer, basic and custom header authentication', async () => {
		const fetch = vi.fn<FetchLike>(async (_url, _init) => response({ status: 'success', data: { resultType: 'scalar', result: [1, '1'] } }));
		await client(fetch, { accessToken: 'fixture-token' }).query({ query: 'up' });
		expect(new Headers(fetch.mock.calls[0]![1]?.headers).get('authorization')).toBe('Bearer fixture-token');
		await client(fetch, { username: 'fixture-user', password: 'fixture-password' }).query({ query: 'up' });
		expect(new Headers(fetch.mock.calls[1]![1]?.headers).get('authorization')).toMatch(/^Basic /u);
		await client(fetch, { headers: { 'x-api-key': 'fixture-header' } }).query({ query: 'up' });
		expect(new Headers(fetch.mock.calls[2]![1]?.headers).get('x-api-key')).toBe('fixture-header');
	});

	it('uses fixed summaries for HTTP, envelope and JSON errors', async () => {
		const http = client(vi.fn<FetchLike>(async () => response({ error: 'PRIVATE_SERVER_ERROR' }, { status: 500 })));
		await expect(http.query({ query: 'up' })).rejects.toMatchObject({ code: 'REQUEST_FAILED', message: 'Prometheus query request failed' });
		const envelope = client(vi.fn<FetchLike>(async () => response({ status: 'error', errorType: 'bad_data', error: 'PRIVATE_SERVER_ERROR' })));
		await expect(envelope.query({ query: 'up' })).rejects.toMatchObject({ code: 'REQUEST_FAILED', message: 'Prometheus request returned an error' });
		const malformed = client(vi.fn<FetchLike>(async () => response({ status: 'success', data: { resultType: 'vector', result: [{ metric: {}, value: ['bad', '1'] }] } })));
		await expect(malformed.query({ query: 'up' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE', message: 'Prometheus returned an invalid response' });
	});

	it('handles cancellation, timeout, close and response limits', async () => {
		let resolve!: (value: Response) => void;
		const pending = vi.fn<FetchLike>((_url, init) => new Promise<Response>((res) => {
			resolve = res;
			init?.signal?.addEventListener('abort', () => undefined);
		}));
		const test = client(pending, { timeoutMs: 10, maxResponseBytes: 8 });
		await expect(test.query({ query: 'up' })).rejects.toMatchObject({ code: 'TIMEOUT' });
		const controller = new AbortController();
		const aborted = test.query({ query: 'up' }, { signal: controller.signal });
		controller.abort();
		await expect(aborted).rejects.toMatchObject({ code: 'ABORTED' });
		const closing = test.query({ query: 'up' });
		await test.close();
		await expect(closing).rejects.toMatchObject({ code: 'CLOSED' });
		await expect(test.query({ query: 'up' })).rejects.toMatchObject({ code: 'CLOSED' });
		resolve(response({ status: 'success', data: { resultType: 'scalar', result: [1, '1'] } }));
		const large = client(vi.fn<FetchLike>(async () => response({ status: 'success', data: { resultType: 'scalar', result: [1, '123456789'] } })), { maxResponseBytes: 8 });
		await expect(large.query({ query: 'up' })).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
	});

	it('cancels a pending response stream and preserves the abort error', async () => {
		let cancelCount = 0;
		const body = new ReadableStream<Uint8Array>({
			start: (stream) => stream.enqueue(new TextEncoder().encode('{')),
			pull: () => new Promise(() => undefined),
			cancel: () => { cancelCount += 1; },
		});
		const fetch = vi.fn<FetchLike>(async () => new Response(body, { headers: { 'content-type': 'application/json' } }));
		const test = client(fetch);
		const controller = new AbortController();
		const request = test.query({ query: 'up' }, { signal: controller.signal });
		await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
		await new Promise((resolve) => setTimeout(resolve, 0));
		controller.abort();
		await expect(request).rejects.toMatchObject({ code: 'ABORTED' });
		expect(cancelCount).toBe(1);
		await test.close();
	});
});
