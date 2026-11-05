import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { ServiceRegistry } from '../registry';
import { createServiceRuntime, ServiceProviderRegistry } from '../runtime';
import { createBuiltinServiceProviders, registerBuiltinServices } from './index';

describe('registered domain services', () => {
	it('registers factories offline and resolves DDG as a normalized search capability', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () =>
			Response.json({ Heading: 'Example', AbstractURL: 'https://example.test', AbstractText: 'Summary' }),
		);
		const registry = registerBuiltinServices(
			new ServiceRegistry({
				context: { services: normalizeCliServices([{ name: 'web', type: 'ddg' }]) },
				fetch,
			}),
		);
		expect(registry.listProviders().map((item) => item.name)).toEqual([
			'duckduckgo',
			'exa',
			'jina',
			'base',
			'sql',
			'redis',
			'openobserve',
			'apollo',
			'prometheus',
			'linear',
			'edge-tts',
			'openai-tts',
		]);
		expect(fetch).not.toHaveBeenCalled();
		const service = await registry.load('search', 'web');
		expect(service.type).toBe('duckduckgo');
		expect(fetch).not.toHaveBeenCalled();
		await expect(service.search({ query: 'example', limit: 1 })).resolves.toMatchObject({
			items: [{ url: 'https://example.test', title: 'Example', summary: 'Summary' }],
		});
		await registry.close();
	});

	it('supports another search provider through the same registration contract', async () => {
		const registry = new ServiceRegistry({
			context: { services: normalizeCliServices([{ name: 'other', type: 'fixture-search' }]) },
		});
		const search = vi.fn(async () => ({ items: [{ url: 'https://example.test' }] }));
		registry.register({
			name: 'fixture-search',
			provides: ['search'],
			create: () => ({ search: { type: 'fixture-search', readOnly: true, search } }),
		});
		await expect((await registry.load('search')).search({ query: 'example' })).resolves.toHaveProperty('items');
		expect(search).toHaveBeenCalledWith({ query: 'example' });
		await registry.close();
	});

	it('exposes the same registered providers through tool transport and preserves aliases', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(
			async () => new Response('page', { headers: { 'content-type': 'text/plain' } }),
		);
		const runtime = createServiceRuntime({
			context: { services: normalizeCliServices([{ name: 'page', type: 'direct' }]) },
			providers: new ServiceProviderRegistry(createBuiltinServiceProviders()),
			fetch,
		});
		try {
			await expect(runtime.getSchema({ params: { service: 'page' } })).resolves.toHaveProperty('tools.fetch');
			expect(fetch).not.toHaveBeenCalled();
			await expect(
				runtime.call({
					params: { service: 'page' },
					body: { toolName: 'fetch', input: { url: 'https://example.test' } },
				}),
			).resolves.toMatchObject({ content: 'page' });
			await expect(
				runtime.call({
					params: { service: 'page' },
					body: { toolName: 'fetch', input: { url: 'https://example.test', secret: 'ignored' } },
				}),
			).rejects.toThrow('Invalid service input');
			expect(fetch).toHaveBeenCalledOnce();
		} finally {
			await runtime.close();
		}
	});
});
