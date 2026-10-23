import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import type { ServiceProviderDefinition } from './index';
import { ServiceRegistry } from './index';

function service(close?: () => void | Promise<void>) {
	return {
		type: 'test',
		readOnly: true as const,
		search: vi.fn(async () => ({ items: [] })),
		...(close ? { close } : {}),
	};
}

function context(services: unknown) {
	return { services: normalizeCliServices(services) };
}

function searchProvider(create: ServiceProviderDefinition<'search'>['create']): ServiceProviderDefinition<'search'> {
	return { name: 'search-provider', aliases: ['sp'], provides: ['search'], create };
}

describe('ServiceRegistry', () => {
	it('routes configured aliases and exposes safe directory projections', async () => {
		const created = vi.fn(({ config }: Parameters<NonNullable<ServiceProviderDefinition<'search'>['create']>>[0]) => {
			expect(config.provider).toBe('sp');
			return { search: service() };
		});
		const registry = new ServiceRegistry({
			context: context([{ name: 'web', type: 'sp', options: { secret: 'PRIVATE_CONFIG' } }]),
		});
		registry.register(searchProvider(created));

		await expect(registry.load('search')).resolves.toMatchObject({ type: 'test', readOnly: true });
		expect(created).toHaveBeenCalledTimes(1);
		expect(registry.hasProvider('sp')).toBe(true);
		expect(registry.listProviders()).toEqual([{ name: 'search-provider', aliases: ['sp'], provides: ['search'] }]);
		expect(registry.list('search')).toEqual([
			{ name: 'web', provider: 'search-provider', provides: ['search'], readOnly: true },
		]);
		expect(JSON.stringify(registry.list())).not.toContain('PRIVATE_CONFIG');
	});

	it('uses explicit name, defaults, and rejects ambiguous capability routing', async () => {
		const created = vi.fn(({ name }: { name: string }) => ({ search: { ...service(), type: name } }));
		const registry = new ServiceRegistry({
			context: context([
				{ name: 'first', type: 'engine' },
				{ name: 'second', type: 'engine' },
			]),
			defaults: { search: 'second' },
		});
		registry.register({ name: 'engine', provides: ['search'], create: created });

		await expect(registry.load('search')).resolves.toMatchObject({ type: 'second' });
		await expect(registry.load('search', 'first')).resolves.toMatchObject({ type: 'first' });
		const ambiguous = new ServiceRegistry({
			context: context([
				{ name: 'first', type: 'engine' },
				{ name: 'second', type: 'engine' },
			]),
		});
		ambiguous.register({ name: 'engine', provides: ['search'], create: created });
		await expect(ambiguous.load('search')).rejects.toThrow('Ambiguous service selection');
	});

	it('does not select disabled services', async () => {
		const create = vi.fn(() => ({ search: service() }));
		const registry = new ServiceRegistry({
			context: context([
				{ name: 'disabled', type: 'engine', disabled: true },
				{ name: 'enabled', type: 'engine' },
			]),
		});
		registry.register({ name: 'engine', provides: ['search'], create });

		await expect(registry.load('search')).resolves.toBeDefined();
		expect(registry.list()).toEqual([{ name: 'enabled', provider: 'engine', provides: ['search'], readOnly: true }]);
		await expect(registry.load('search', 'disabled')).rejects.toThrow('Named service is unavailable');
	});
	it('fails closed for an unavailable configured default', async () => {
		const create = vi.fn(() => ({ search: service() }));
		const registry = new ServiceRegistry({
			context: context([{ name: 'available', type: 'provider' }]),
			defaults: { search: 'missing' },
		});
		registry.register({ name: 'provider', provides: ['search'], create });
		await expect(registry.load('search')).rejects.toThrow('Named service is unavailable');
		expect(create).not.toHaveBeenCalled();
		await registry.close();
	});

	it('deduplicates concurrent creation and retries after a failed creation', async () => {
		let attempt = 0;
		const create = vi.fn(async () => {
			attempt += 1;
			if (attempt === 1) throw new Error('PRIVATE_CONFIG');
			return { search: service() };
		});
		const registry = new ServiceRegistry({ context: context([{ name: 'engine', type: 'provider' }]) });
		registry.register({ name: 'provider', provides: ['search'], create });

		await expect(Promise.all([registry.load('search'), registry.load('search')])).rejects.toThrow(
			'Failed to create service',
		);
		expect(create).toHaveBeenCalledTimes(1);
		await expect(registry.load('search')).resolves.toBeDefined();
		expect(create).toHaveBeenCalledTimes(2);
	});

	it('waits for pending creation, closes shared instances once, and rejects late loads', async () => {
		const shared = {
			...service(vi.fn()),
			fetch: vi.fn(async () => ({ url: 'https://example.com', content: '' })),
		};
		let resolveCreation!: (value: typeof shared) => void;
		const pending = new Promise<typeof shared>((resolve) => {
			resolveCreation = resolve;
		});
		const registry = new ServiceRegistry({ context: context([{ name: 'both', type: 'both' }]) });
		registry.register({
			name: 'both',
			provides: ['search', 'fetch'],
			create: async () => pending.then(() => ({ search: shared, fetch: shared })),
		});
		const loading = registry.load('search');
		const rejectedLoad = expect(loading).rejects.toThrow('Service registry is closed');
		const closing = registry.close();
		await expect(registry.load('fetch')).rejects.toThrow('Service registry is closed');
		resolveCreation(shared);
		await rejectedLoad;
		await expect(closing).resolves.toBeUndefined();
		expect(shared.close).toHaveBeenCalledTimes(1);
		const secondClose = registry.close();
		await expect(secondClose).resolves.toBeUndefined();
		expect(shared.close).toHaveBeenCalledTimes(1);
	});

	it('aggregates all close failures', async () => {
		const firstClose = vi.fn(() => Promise.reject(new Error('first')));
		const secondClose = vi.fn(() => Promise.reject(new Error('second')));
		const registry = new ServiceRegistry({
			context: context([
				{ name: 'first', type: 'one' },
				{ name: 'second', type: 'two' },
			]),
		});
		registry.register({ name: 'one', provides: ['search'], create: () => ({ search: service(firstClose) }) });
		registry.register({ name: 'two', provides: ['search'], create: () => ({ search: service(secondClose) }) });
		await registry.load('search', 'first');
		await registry.load('search', 'second');
		try {
			await registry.close();
			throw new Error('close unexpectedly succeeded');
		} catch (error) {
			expect(error).toBeInstanceOf(AggregateError);
			expect((error as AggregateError).errors.map((item) => (item as Error).message)).toEqual(['first', 'second']);
		}
		expect(firstClose).toHaveBeenCalledTimes(1);
		expect(secondClose).toHaveBeenCalledTimes(1);
	});

	it('rejects invalid provider declarations and capability instances', async () => {
		const registry = new ServiceRegistry();
		expect(() => registry.register({ name: 'bad', provides: [], create: () => ({}) } as never)).toThrow(
			'Invalid service provider',
		);
		expect(() =>
			registry.register({
				name: 'one',
				aliases: ['alias'],
				provides: ['search'],
				create: () => ({ search: service() }),
			}),
		).not.toThrow();
		expect(() =>
			registry.register({ name: 'alias', provides: ['search'], create: () => ({ search: service() }) }),
		).toThrow('Duplicate service provider');
		const invalid = new ServiceRegistry({ context: context([{ name: 'one', type: 'bad' }]) });
		invalid.register({
			name: 'bad',
			provides: ['search'],
			create: () => ({ search: { type: 'bad', readOnly: true } }),
		} as never);
		await expect(invalid.load('search')).rejects.toThrow('Failed to create service');
	});

	it('releases partially created capability instances after validation failure', async () => {
		const close = vi.fn();
		const registry = new ServiceRegistry({ context: context([{ name: 'partial', type: 'partial' }]) });
		registry.register({
			name: 'partial',
			provides: ['search', 'fetch'],
			create: () => ({ search: service(close) }),
		} as never);
		await expect(registry.load('search')).rejects.toThrow('Failed to create service');
		await registry.close();
		expect(close).toHaveBeenCalledOnce();
	});
});
