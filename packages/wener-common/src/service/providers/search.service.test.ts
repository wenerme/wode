import { describe, expect, it, vi } from 'vitest';
import { createDuckDuckGoSearchService } from './duckduckgo';

describe('DuckDuckGo search capability', () => {
	it('normalizes results and keeps raw provider payload out of the domain response', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () =>
			Response.json({
				Heading: 'Page',
				AbstractText: 'Summary',
				AbstractURL: 'https://example.test/page',
				privateField: 'vendor-only',
			}),
		);
		const service = createDuckDuckGoSearchService({ fetch });
		const response = await service.search({ query: 'example', limit: 1 });
		expect(response).toEqual({
			items: [{ title: 'Page', url: 'https://example.test/page', summary: 'Summary' }],
			metadata: { query: 'example', source: 'instant-answer' },
		});
		expect(JSON.stringify(response)).not.toContain('vendor-only');
	});

	it('rejects unsupported filters before fetching and preserves caller cancellation', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const service = createDuckDuckGoSearchService({ fetch });
		await expect(service.search({ query: 'example', includeDomains: ['example.test'] })).rejects.toThrow('Unsupported');
		await expect(service.search({ query: 'example', limit: 0 })).rejects.toThrow('limit');
		const controller = new AbortController();
		const reason = new Error('stopped');
		controller.abort(reason);
		await expect(service.search({ query: 'example' }, { signal: controller.signal })).rejects.toBe(reason);
		expect(fetch).not.toHaveBeenCalled();
	});
});
