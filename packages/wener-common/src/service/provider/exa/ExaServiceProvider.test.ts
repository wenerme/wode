import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../../config';
import { ServiceRegistry } from '../../registry';
import { createServiceProviderAdapter, createServiceRuntime, ServiceProviderRegistry } from '../../runtime';
import { createExaService, ExaServiceProvider } from './ExaServiceProvider';

describe('Exa search and fetch capabilities', () => {
	it('maps search options through the existing client and normalizes paged results', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async (url, init) => {
			expect(String(url)).toBe('https://search.example.test/v1/search');
			expect(new Headers(init?.headers).get('x-api-key')).toBe('fixture-key');
			expect(new Headers(init?.headers).get('x-test')).toBe('fixture');
			expect(JSON.parse(String(init?.body))).toEqual({
				query: 'example',
				type: 'deep',
				category: 'news',
				numResults: 2,
				includeDomains: ['example.test'],
				excludeDomains: ['excluded.test'],
				startPublishedDate: '2026-01-01T00:00:00.000Z',
				endPublishedDate: '2026-10-01',
				contents: { text: { maxCharacters: 100 }, summary: true, highlights: { maxCharacters: 100 }, maxAgeHours: 0 },
			});
			return Response.json({
				requestId: 'request-1',
				results: [
					{ url: 'https://example.test/skip' },
					{
						url: 'https://example.test/page',
						title: 'Page',
						text: 'Body',
						summary: 'Summary',
						highlights: ['Highlight'],
						publishedDate: '2026-01-01',
						author: 'Author',
					},
				],
				vendorOnly: true,
			});
		});
		const service = createExaService({
			fetch,
			apiKey: 'fixture-key',
			baseUrl: 'https://search.example.test/v1',
			headers: { 'x-test': 'fixture' },
		});
		const result = await service.search.search({
			query: 'example',
			limit: 1,
			offset: 1,
			searchType: 'deep',
			category: 'news',
			urls: ['https://example.test/page'],
			includeDomains: ['example.test'],
			excludeDomains: ['excluded.test'],
			from: new Date('2026-01-01T00:00:00Z'),
			to: '2026-10-01',
			content: { text: true, summary: true, highlights: true, live: true, maxCharacters: 100 },
		});
		expect(result.items).toEqual([
			{
				url: 'https://example.test/page',
				title: 'Page',
				text: 'Body',
				summary: 'Summary',
				highlights: ['Highlight'],
				publishedAt: '2026-01-01',
				metadata: { author: 'Author' },
			},
		]);
		expect(result).not.toHaveProperty('raw');
		expect(JSON.stringify(result)).not.toContain('vendorOnly');
	});

	it('defaults fetch to text and returns normalized content with opt-in sanitized raw and metadata', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async (url, init) => {
			expect(String(url)).toBe('https://api.exa.ai/contents');
			const body = JSON.parse(String(init?.body));
			expect(body.urls).toEqual(['https://example.test/page']);
			expect(body.maxAgeHours).toBe(0);
			return Response.json({
				requestId: 'request-1',
				results: [
					{
						url: 'https://example.test/page',
						title: 'Page',
						text: 'Navigation\n# Page\nBody\nCopyright © fixture',
						summary: 'Summary',
						highlights: ['Highlight'],
					},
				],
				headers: { authorization: 'Bearer fixture-key' },
				echoed: 'fixture-key',
				vendorOnly: true,
			});
		});
		const service = createExaService({ fetch, apiKey: 'fixture-key' }).fetch;
		const result = await service.fetch({ url: 'https://example.test/page', live: true });
		expect(result.content).toBe('# Page\nBody');
		expect(result).not.toHaveProperty('raw');
		expect(result).not.toHaveProperty('metadata');
		expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body)).text).toBe(true);
		const raw = await service.fetch({
			url: 'https://example.test/page',
			summary: true,
			text: false,
			highlights: true,
			live: true,
			raw: true,
			metadata: true,
		});
		expect(raw.content).toBe('Summary');
		expect(raw.metadata).toMatchObject({ requestId: 'request-1' });
		expect(raw.raw).toMatchObject({ vendorOnly: true, echoed: '[REDACTED]' });
		expect(JSON.stringify(raw)).not.toContain('fixture-key');
		expect(raw.raw).not.toHaveProperty('headers');
	});

	it('falls back to highlights and applies content limits', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () =>
			Response.json({ results: [{ url: 'https://example.test', highlights: ['', 'Highlight'] }] }),
		);
		const service = createExaService({ fetch, headers: { 'x-api-key': 'fixture-key' } }).fetch;
		expect(
			await service.fetch({ url: 'https://example.test', text: false, highlights: true, maxCharacters: 4 }),
		).toMatchObject({ content: 'High' });
	});

	it('rejects per-URL errors and missing results with a fixed sanitized error', async () => {
		for (const response of [
			{ statuses: [{ status: 'error', error: { tag: 'CRAWL_NOT_FOUND', httpStatusCode: 404 } }], results: [] },
			{
				statuses: [{ status: 'error', error: { message: 'fixture-key supplier body' } }],
				results: [{ url: 'https://example.test' }],
			},
			{ statuses: [{ status: 'success' }], results: [] },
			{ results: [{ url: 'https://other.example.test', text: 'supplier body' }] },
		]) {
			const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(response));
			const service = createExaService({ fetch, apiKey: 'fixture-key' }).fetch;
			const error = await service.fetch({ url: 'https://example.test', raw: true }).catch((error) => error);
			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe('Exa fetch failed');
			expect(JSON.stringify(error)).not.toMatch(/fixture-key|supplier body|CRAWL_NOT_FOUND/);
		}
	});

	it('allows a successful matching result with empty content', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () =>
			Response.json({ statuses: [{ status: 'success' }], results: [{ url: 'https://example.test' }] }),
		);
		await expect(
			createExaService({ fetch, apiKey: 'fixture-key' }).fetch.fetch({ url: 'https://example.test' }),
		).resolves.toMatchObject({ url: 'https://example.test', content: '' });
	});

	it('validates requests offline and does not leak transport errors', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => {
			throw new Error('fixture-key PRIVATE_BODY');
		});
		const service = createExaService({ fetch, apiKey: 'fixture-key' });
		for (const input of [
			{ query: '' },
			{ query: 'example', limit: 101 },
			{ query: 'example', cursor: 'cursor' },
			{ query: 'example', content: { unknown: true } },
			{ query: 'example', urls: ['https://user:pass@example.test'] },
		]) {
			await expect(service.search.search(input as never)).rejects.toThrow();
		}
		await expect(service.fetch.fetch({ url: 'https://user:pass@example.test' })).rejects.toThrow(
			'Invalid fetch request',
		);
		expect(fetch).not.toHaveBeenCalled();
		await expect(service.search.search({ query: 'example' })).rejects.toThrow(/^Exa search failed$/);
		await expect(service.fetch.fetch({ url: 'https://example.test' })).rejects.toThrow(/^Exa fetch failed$/);
		expect(() => createExaService({ apiKey: 'fixture-key', baseUrl: 'file:///invalid' })).toThrow(
			'Invalid Exa service configuration',
		);
		expect(() => createExaService({})).toThrow('Invalid Exa service configuration');
	});

	it('preserves caller cancellation before and during requests', async () => {
		const controller = new AbortController();
		const reason = new Error('cancelled');
		const fetch = vi.fn<typeof globalThis.fetch>(
			async (_url, init) =>
				new Promise((_, reject) => {
					init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), {
						once: true,
					});
					controller.abort(reason);
				}),
		);
		const service = createExaService({ fetch, apiKey: 'fixture-key' });
		await expect(service.search.search({ query: 'example' }, { signal: controller.signal })).rejects.toBe(reason);
		await expect(service.fetch.fetch({ url: 'https://example.test' }, { signal: controller.signal })).rejects.toBe(
			reason,
		);
		expect(fetch).toHaveBeenCalledOnce();
	});

	it('registers both capabilities without resolving environment references until load', async () => {
		const getEnv = vi.fn(() => 'fixture-key');
		const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({ results: [] }));
		const registry = new ServiceRegistry({
			context: {
				services: normalizeCliServices([{ name: 'web', type: 'exa', options: { apiKey: 'env://EXAMPLE_API_KEY' } }]),
			},
			getEnv,
			fetch,
		}).register(ExaServiceProvider);
		expect(registry.list('search')[0]?.provides).toEqual(['search', 'fetch']);
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		await registry.load('search', 'web');
		await registry.load('fetch', 'web');
		expect(getEnv).toHaveBeenCalledExactlyOnceWith('EXAMPLE_API_KEY');
		expect(fetch).not.toHaveBeenCalled();
		await registry.close();
	});

	it('advertises and validates the complete runtime schemas before resolving credentials', async () => {
		const getEnv = vi.fn(() => 'fixture-key');
		const fetch = vi.fn<typeof globalThis.fetch>(async () =>
			Response.json({ results: [{ url: 'https://example.test' }] }),
		);
		const runtime = createServiceRuntime({
			context: {
				services: normalizeCliServices([{ name: 'web', type: 'exa', options: { apiKey: 'env://EXAMPLE_API_KEY' } }]),
			},
			providers: new ServiceProviderRegistry([createServiceProviderAdapter(ExaServiceProvider)]),
			fetch,
			getEnv,
		});
		try {
			const schema = await runtime.getSchema({ params: { service: 'web' } });
			expect(schema.tools.search?.inputSchema.properties).toHaveProperty('content');
			expect(schema.tools.fetch?.inputSchema.properties).toHaveProperty('main');
			expect(getEnv).not.toHaveBeenCalled();
			await expect(
				runtime.call({
					params: { service: 'web' },
					body: { toolName: 'search', input: { query: 'example', content: { highlights: 'yes' } } },
				}),
			).rejects.toThrow('Invalid service input');
			expect(getEnv).not.toHaveBeenCalled();
			await runtime.call({
				params: { service: 'web' },
				body: {
					toolName: 'search',
					input: {
						query: 'example',
						searchType: 'auto',
						category: 'news',
						urls: ['https://example.test'],
						content: { highlights: true, live: true },
					},
				},
			});
			await runtime.call({
				params: { service: 'web' },
				body: {
					toolName: 'fetch',
					input: {
						url: 'https://example.test',
						text: true,
						summary: true,
						highlights: true,
						live: true,
						main: false,
						metadata: true,
						raw: true,
					},
				},
			});
			expect(fetch).toHaveBeenCalledTimes(2);
		} finally {
			await runtime.close();
		}
	});
});
