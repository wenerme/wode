import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { createDuckDuckGoSearchService, DuckDuckGoSearchServiceProvider } from '../provider/duckduckgo/DuckDuckGoSearchServiceProvider';
import { createExaService, ExaServiceProvider } from '../provider/exa/ExaServiceProvider';
import { ServiceRegistry } from '../registry';
import { createServiceProviderAdapter, createServiceRuntime, ServiceProviderRegistry } from '../runtime';
import { SearchServiceCapability } from './ISearchService';
import { SearchOperations } from './operations';
import {
	type SearchRequest,
	type SearchServiceCallOptions,
	SearchResponseSchema,
	SearchServiceContract,
} from './SearchServiceContract';

describe('Search contract providers', () => {
	it('keeps both native search capabilities stateless', () => {
		const services = [createDuckDuckGoSearchService(), createExaService({ apiKey: 'fixture-key' }).search];
		for (const service of services) {
			expect(service.readOnly).toBe(true);
			expect(service).not.toHaveProperty('close');
			expect(Symbol.asyncDispose in service).toBe(false);
		}
		expect(DuckDuckGoSearchServiceProvider.operations).toBe(SearchOperations);
		expect(ExaServiceProvider.operations?.search).toBe(SearchOperations.search);
	});

	it('invokes the service with parsed input and caller options as separate arguments', async () => {
		const search = vi.fn(async (_input: SearchRequest, _options?: SearchServiceCallOptions) => ({ items: [] }));
		const registry = new ServiceRegistry({
			context: { services: normalizeCliServices([{ name: 'test', type: 'test' }]) },
		}).register({
			name: 'test',
			provides: [SearchServiceCapability],
			operations: SearchOperations,
			create: () => ({ search: { type: 'test', readOnly: true, search } }),
		});
		try {
			const signal = new AbortController().signal;
			await expect(SearchOperations.search.execute(registry, 'test', { query: 'example' }, { signal }))
				.resolves.toEqual({ items: [] });
			expect(search).toHaveBeenCalledExactlyOnceWith({ query: 'example' }, { signal });
		} finally {
			await registry.close();
		}
	});

	it('keeps capability selection, provider defaults and normalized supplier responses', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async (url, init) => {
			if (String(url).includes('duckduckgo')) {
				return Response.json({ Heading: 'DDG', AbstractURL: 'https://example.test/ddg', AbstractText: 'Summary' });
			}
			expect(JSON.parse(String(init?.body))).toMatchObject({ query: 'example', numResults: 10 });
			return Response.json({
				requestId: 'request-1',
				results: [{ url: 'https://example.test/exa', publishedDate: null, extras: { vendor: [1, null] } }],
				costDollars: { total: 0.01, vendorCost: { value: true } },
				output: { content: { arbitrary: ['vendor'] } },
				vendorField: true,
			});
		});
		const registry = new ServiceRegistry({
			context: { services: normalizeCliServices([
				{ name: 'ddg', type: 'ddg' },
				{ name: 'exa', type: 'exa', options: { apiKey: 'fixture-key' } },
			]) },
			defaults: { search: 'ddg' },
			fetch,
		}).register(DuckDuckGoSearchServiceProvider).register(ExaServiceProvider);
		try {
			const ddg = await registry.load(SearchServiceCapability);
			expect(ddg.type).toBe('duckduckgo');
			const response = await ddg.search({ query: 'example' });
			expect(SearchResponseSchema.parse(response)).toEqual(response);
			expect(response.metadata).toEqual({ query: 'example', source: 'instant-answer' });
			const exa = await SearchOperations.search.execute(registry, 'exa', { query: 'example', raw: true });
			expect(SearchResponseSchema.parse(exa)).toEqual(exa);
			expect(exa.raw).toMatchObject({ vendorField: true, output: { content: { arbitrary: ['vendor'] } } });
			expect(exa.metadata).toMatchObject({ costDollars: { vendorCost: { value: true } } });
		} finally {
			await registry.close();
		}
	});

	it('advertises canonical keys/schema without loading providers and forwards cancellation as the second argument', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const getEnv = vi.fn(() => 'fixture-key');
		const runtime = createServiceRuntime({
			context: { services: normalizeCliServices([
				{ name: 'exa', type: 'exa', options: { apiKey: 'env://EXAMPLE_API_KEY' } },
				{ name: 'ddg', type: 'ddg' },
			]) },
			providers: new ServiceProviderRegistry([
				createServiceProviderAdapter(ExaServiceProvider),
				createServiceProviderAdapter(DuckDuckGoSearchServiceProvider),
			]),
			fetch,
			getEnv,
		});
		try {
			for (const service of ['exa', 'ddg']) {
				const schema = await runtime.getSchema({ params: { service } });
				expect(Object.keys(schema.tools).filter((key) => key === 'search')).toEqual(Object.keys(SearchServiceContract));
				expect(schema.tools.search).toMatchObject(SearchOperations.search.tool);
				await expect(runtime.call({ params: { service }, body: { toolName: 'search', input: {} } }))
					.rejects.toThrow('Invalid service input');
			}
			expect(getEnv).not.toHaveBeenCalled();
			expect(fetch).not.toHaveBeenCalled();
			const controller = new AbortController();
			const reason = new Error('cancelled');
			controller.abort(reason);
			for (const service of ['exa', 'ddg']) {
				await expect(runtime.call(
					{ params: { service }, body: { toolName: 'search', input: { query: 'example' } } },
					{ signal: controller.signal },
				)).rejects.toBe(reason);
			}
			expect(fetch).not.toHaveBeenCalled();
		} finally {
			await runtime.close();
		}
	});
});
