import { DuckDuckGoClient } from '@wener/client/duckduckgo';
import { describe, expect, it, vi } from 'vitest';
import { createDuckDuckGoSearchService } from './DuckDuckGoSearchServiceProvider';

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
		expect(await service.search({ query: 'example', raw: false })).toEqual(response);
	});

	it('returns supplier JSON only when raw is explicitly requested', async () => {
		const body = {
			Heading: 'Page',
			AbstractText: 'Summary',
			AbstractURL: 'https://example.test/page',
			vendorField: 'supplier data',
		};
		const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(body));
		const result = await createDuckDuckGoSearchService({ fetch }).search({ query: 'example', raw: true });
		expect(result).toEqual({
			items: [{ title: 'Page', url: 'https://example.test/page', summary: 'Summary' }],
			metadata: { query: 'example', source: 'instant-answer' },
			raw: body,
		});
	});

	it('preserves reflected values and supplier fields in raw and normalized business results', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => {
			expect(new Headers(init?.headers).get('authorization')).toBe('Bearer fixture-secret');
			return Response.json({
				Heading: 'Page',
				AbstractText: 'Reflected fixture-secret and fixture-api-key',
				AbstractURL: 'https://example.test/page',
				headers: { authorization: 'Bearer fixture-secret' },
				apiKey: 'fixture-api-key',
				echo: 'Bearer fixture-secret / fixture-api-key',
			});
		});
		const service = createDuckDuckGoSearchService({
			fetch,
			headers: { Authorization: 'Bearer fixture-secret', 'X-Api-Key': 'fixture-api-key' },
		});
		const result = await service.search({ query: 'example', raw: true });
		expect(result.items[0]?.summary).toBe('Reflected fixture-secret and fixture-api-key');
		expect(result.raw).toMatchObject({
			echo: 'Bearer fixture-secret / fixture-api-key',
			headers: { authorization: 'Bearer fixture-secret' },
			apiKey: 'fixture-api-key',
		});
		const normalized = await service.search({ query: 'example', raw: false });
		expect(normalized).not.toHaveProperty('raw');
		expect(normalized.items[0]?.summary).toBe('Reflected fixture-secret and fixture-api-key');
	});

	it('falls back to the client search response when its supplier body is absent', async () => {
		const response = {
			query: 'example',
			source: 'html' as const,
			results: [{ title: 'Page', url: 'https://example.test/page', snippet: 'Summary' }],
		};
		const search = vi.spyOn(DuckDuckGoClient.prototype, 'search').mockResolvedValue(response);
		try {
			const result = await createDuckDuckGoSearchService().search({ query: 'example', raw: true });
			expect(result.raw).toEqual(response);
			expect(result.items).toEqual([{ title: 'Page', url: 'https://example.test/page', summary: 'Summary' }]);
		} finally {
			search.mockRestore();
		}
	});

	it('rejects unsupported filters before fetching and preserves caller cancellation', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const service = createDuckDuckGoSearchService({ fetch });
		await expect(service.search({ query: 'example', includeDomains: ['example.test'] })).rejects.toThrow('Unsupported');
		await expect(service.search({ query: 'example', limit: 0 })).rejects.toThrow('limit');
		await expect(service.search({ query: 'example', raw: 'true' } as never)).rejects.toThrow('Unsupported');
		await expect(service.search({ query: 'example', content: {} })).rejects.toThrow('Unsupported');
		await expect(service.search({ query: 'example', count: 1 } as never)).rejects.toThrow('Unsupported');
		await expect(service.search({ query: ' ' })).rejects.toThrow('non-empty query');
		await expect(service.search(null as never)).rejects.toThrow(TypeError);
		await expect(service.search({ query: 'example', offset: -1 })).rejects.toThrow('DuckDuckGo offset');
		const controller = new AbortController();
		const reason = new Error('stopped');
		controller.abort(reason);
		await expect(service.search({ query: 'example' }, { signal: controller.signal })).rejects.toBe(reason);
		expect(fetch).not.toHaveBeenCalled();
	});
});
