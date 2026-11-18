import { describe, expect, it, vi } from 'vitest';
import { BaseFetchServiceProvider, createBaseFetchService } from '../provider/base/BaseFetchServiceProvider';
import { createExaService, ExaServiceProvider } from '../provider/exa/ExaServiceProvider';
import { createJinaFetchService, JinaFetchServiceProvider } from '../provider/jina/JinaFetchServiceProvider';
import { ServiceRegistry } from '../registry';
import { createServiceProviderAdapter } from '../runtime';
import { FetchRequestSchema, FetchResponseSchema, FetchServiceContract } from './FetchServiceContract';
import { FetchServiceCapability } from './IFetchService';
import { FetchOperations } from './operations';

const url = 'https://example.test/page';
const providers = [
	{
		name: 'base', definition: BaseFetchServiceProvider,
		create: (fetch: typeof globalThis.fetch) => createBaseFetchService({ fetch }),
		response: () => new Response('<main><h1>Page</h1><p>Body</p></main>', { headers: { 'content-type': 'text/html' } }),
	},
	{
		name: 'jina', definition: JinaFetchServiceProvider,
		create: (fetch: typeof globalThis.fetch) => createJinaFetchService({ fetch }),
		response: () => Response.json({ data: { url, title: 'Page', content: '# Page\nBody', metadata: { custom: [1, null] } } }),
	},
	{
		name: 'exa', definition: ExaServiceProvider,
		create: (fetch: typeof globalThis.fetch) => createExaService({ fetch, apiKey: 'fixture-key' }).fetch,
		response: () => Response.json({ results: [{ url, title: 'Page', text: '# Page\nBody', highlights: ['Body'] }] }),
	},
];

describe.each(providers)('Fetch contract with $name provider', ({ definition, create, response }) => {
	it('publishes the canonical fetch operation and matching tool keys', () => {
		const provider = createServiceProviderAdapter(definition);
		expect(definition.operations?.fetch).toBe(FetchOperations.fetch);
		expect(Object.entries(definition.operations ?? {})
			.filter(([, operation]) => operation.capability === FetchServiceCapability)
			.map(([key]) => key)).toEqual(Object.keys(FetchServiceContract));
		expect(provider.tools?.fetch).toEqual(FetchOperations.fetch.tool);
		expect(provider.tools?.fetch.outputSchema).toMatchObject({ type: 'object', required: ['content', 'url'] });
	});

	it('returns the normalized contract envelope, remains stateless and forwards signal', async () => {
		const controller = new AbortController();
		const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => {
			expect(init?.signal).toBe(controller.signal);
			return response();
		});
		const service = create(fetch);
		expect(service.close).toBeUndefined();
		expect(Symbol.asyncDispose in service).toBe(false);
		const input = { url, raw: true, metadata: true };
		expect(FetchRequestSchema.parse(input)).toEqual(input);
		const result = await service.fetch(input, { signal: controller.signal });
		expect(FetchResponseSchema.parse(result)).toEqual(result);
		expect(result).toMatchObject({ url, content: '# Page\nBody' });
		expect(result.raw).toBeDefined();
		expect(fetch).toHaveBeenCalledOnce();
	});

	it('keeps required input, unsupported options and caller cancellation ahead of network calls', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => response());
		const service = create(fetch);
		await expect(service.fetch(undefined as never)).rejects.toThrow('Invalid fetch request');
		await expect(service.fetch({ url }, { timeout: 1 } as never)).rejects.toThrow('Unsupported fetch call option');
		const controller = new AbortController();
		const reason = new Error('fixture cancellation');
		controller.abort(reason);
		await expect(service.fetch({ url }, { signal: controller.signal })).rejects.toBe(reason);
		expect(fetch).not.toHaveBeenCalled();
	});
});

describe('Fetch operation dispatch', () => {
	it('uses the typed capability and validates input before loading the provider', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('Body'));
		const registry = new ServiceRegistry({
			context: { services: { page: { provider: 'base', readOnly: true } } }, fetch,
		}).register(BaseFetchServiceProvider);
		const load = vi.spyOn(registry, 'load');
		try {
			await expect(FetchOperations.fetch.execute(registry, 'page', undefined)).rejects.toThrow('Invalid service input');
			expect(load).not.toHaveBeenCalled();
			const signal = new AbortController().signal;
			const result = await FetchOperations.fetch.execute(registry, 'page', { url }, { signal });
			expect(load).toHaveBeenCalledExactlyOnceWith(FetchServiceCapability, 'page');
			expect(fetch.mock.lastCall?.[1]?.signal).toBe(signal);
			expect(FetchServiceContract.fetch['~orpc'].outputSchema?.parse(result)).toEqual(result);
		} finally {
			await registry.close();
		}
	});
});
