import { describe, expect, it, vi } from 'vitest';
import { SqlServiceProvider } from '../providers/sql';
import { ServiceRegistry, type ServiceProviderDefinition } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { SqlTools } from '../runtime/sql-tools';
import { SqlOperations } from './operations';
import type { ISqlService } from './types';

describe('SQL registered operations', () => {
	it('covers the existing contract and preserves typed arguments, options and zero-input ping', async () => {
		const result = { columns: [], rows: [], durationMs: 0 };
		const service: ISqlService = {
			type: 'sql', dialect: 'sqlite', readOnly: false,
			ping: vi.fn(async () => ({ ok: true, durationMs: 0 })),
			query: vi.fn(async () => result), exec: vi.fn(async () => result),
			listObject: vi.fn(async () => []),
			describeObject: vi.fn(async () => ({ object: { name: 'example', type: 'table' } })), close: vi.fn(),
			[Symbol.asyncDispose]: vi.fn(async () => {}),
		};
		const definition: ServiceProviderDefinition<ISqlService> = { ...SqlServiceProvider, create: () => ({ sql: service }) };
		const registry = new ServiceRegistry({ context: { services: { db: { provider: 'sql', readOnly: false } } } });
		registry.register(definition);
		const options = { signal: new AbortController().signal };
		await SqlOperations.ping.execute(registry, 'db', {}, options);
		expect(service.ping).toHaveBeenCalledExactlyOnceWith(options);
		for (const test of [
			{ operation: SqlOperations.query, input: { statement: 'SELECT ?', params: [1], limit: 2, offset: 3 }, invoke: service.query },
			{ operation: SqlOperations.exec, input: { statement: 'DELETE FROM example', params: [] }, invoke: service.exec },
			{ operation: SqlOperations.listObject, input: { parent: { schema: 'main' }, search: 'exam', limit: 2 }, invoke: service.listObject },
			{ operation: SqlOperations.describeObject, input: { object: { name: 'example' } }, invoke: service.describeObject },
		]) {
			await test.operation.execute(registry, 'db', test.input, options);
			expect(test.invoke).toHaveBeenCalledExactlyOnceWith(test.input, options);
		}
		expect(createServiceProviderAdapter(definition).tools).toEqual(SqlTools);
		expect(Object.keys(SqlOperations)).toEqual(Object.keys(SqlTools));
		await registry.close();
		expect(service.close).toHaveBeenCalledTimes(1);
	});

	it.each(['unknown', 'input', 'readonly', 'cancelled'])('rejects %s before resolving env or constructing a real SQL driver', async (kind) => {
		const adapter = createServiceProviderAdapter(SqlServiceProvider);
		const config = { provider: 'sql', readOnly: true, baseUrl: 'env://SQL_TEST_URL' };
		const getEnv = vi.fn(() => 'postgres://example.test/db');
		const sqlDriver = vi.fn((): never => { throw new Error('must not create'); });
		const client = await adapter.create({ name: 'db', config, context: { services: { db: config } }, fetch: globalThis.fetch, getEnv, sqlDriver });
		const controller = new AbortController();
		if (kind === 'cancelled') controller.abort();
		await expect(client.call(kind === 'unknown' ? 'missing' : kind === 'readonly' ? 'exec' : 'query',
			kind === 'input' ? { statement: 1 } : { statement: 'SELECT 1' }, { signal: controller.signal })).rejects.toThrow();
		expect(sqlDriver).not.toHaveBeenCalled();
		expect(getEnv).not.toHaveBeenCalled();
		await client.close?.();
	});
});
