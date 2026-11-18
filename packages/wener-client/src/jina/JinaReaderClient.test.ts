import { describe, expect, it, vi } from 'vitest';
import { JinaReaderClient } from './index';

describe('JinaReaderClient', () => {
	it('reads web content through r.jina.ai as JSON', async () => {
		const calls: Array<{ url: string; init: RequestInit }> = [];
		const client = new JinaReaderClient({
			baseUrl: 'https://reader.example.test',
			fetch: async (input, init = {}) => {
				calls.push({ url: String(input), init });
				return new Response(
					JSON.stringify({ data: { title: 'Example', url: 'https://example.test', content: '# Example' } }),
					{
						status: 200,
						headers: { 'content-type': 'application/json' },
					},
				);
			},
		});

		const response = await client.read('https://example.test');

		expect(response.data?.content).toBe('# Example');
		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe('https://reader.example.test/https://example.test');
		expect(new Headers(calls[0]?.init.headers).get('accept')).toBe('application/json');
	});
	it('preserves HTTP targets and cancellation with a timeout enabled', async () => {
		const controller = new AbortController();
		const reason = new Error('stopped');
		const fetch = vi.fn(async (input: unknown, options?: RequestInit) => {
			expect(String(input)).toBe('https://r.jina.ai/http://example.test/page');
			controller.abort(reason);
			expect(options?.signal?.reason).toBe(reason);
			throw reason;
		});
		const client = new JinaReaderClient({ fetch, timeout: 1000 });
		await expect(client.read('http://example.test/page', { signal: controller.signal })).rejects.toBe(reason);
		await expect(client.read('http://example.test/page', { signal: controller.signal })).rejects.toBe(reason);
		expect(fetch).toHaveBeenCalledOnce();
	});
	it('rejects when the timeout expires while the response body is being consumed', async () => {
		vi.useFakeTimers();
		try {
			const response = new Response();
			vi.spyOn(response, 'text').mockImplementation(async () => {
				await vi.advanceTimersByTimeAsync(10);
				return JSON.stringify({ data: { content: 'late response' } });
			});
			const client = new JinaReaderClient({ fetch: async () => response, timeout: 10 });
			await expect(client.read('https://example.test')).rejects.toMatchObject({ name: 'AbortError' });
			expect(vi.getTimerCount()).toBe(0);
		} finally {
			vi.useRealTimers();
		}
	});
});
