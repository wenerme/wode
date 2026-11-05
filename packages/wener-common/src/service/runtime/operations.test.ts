import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { defineServiceCapability, ServiceRegistry, type ServiceProviderDefinition } from '../registry';
import type { IRedisService } from '../redis';
import { SqlServiceCapability, type ISqlService } from '../sql/ISqlService';
import { createServiceProviderAdapter } from './createServiceProviderAdapter';
import { defineServiceOperation } from './defineServiceOperation';
import type { ServiceCallOptions, ServiceTool } from './types';

interface TestOperationService {
	type: 'operation-test';
	readOnly: boolean;
	echo(input: { value: string }, options: ServiceCallOptions): Promise<{ value: string }>;
	close(): void;
}
// A custom capability needs only its own token; no central capability table is extended.
const OperationTestCapability = defineServiceCapability<TestOperationService>('operationTest');

const input = z.strictObject({ value: z.string().min(1) });
const tool: ServiceTool = {
	title: 'Echo', description: 'Return the supplied value', inputSchema: z.toJSONSchema(input),
	annotations: { readOnlyHint: true },
};
const echo = defineServiceOperation({
	capability: OperationTestCapability, tool, input,
	invoke: (service, input, options) => service.echo(input, options),
});

async function fixture(readOnly = true) {
	const service: TestOperationService = {
		type: 'operation-test', readOnly,
		echo: vi.fn(async (value) => value), close: vi.fn(),
	};
	const create = vi.fn(async () => ({ operationTest: service }));
	const definition: ServiceProviderDefinition<TestOperationService> = {
		name: 'operation-test', provides: [OperationTestCapability],
		title: 'Operation test', description: 'A custom service', documentationUrl: 'https://example.test/operations',
		examples: [{ command: 'example echo hello', description: 'Echo a value.' }],
		operations: {
			echo: { ...echo, tool: structuredClone(echo.tool) },
			write: defineServiceOperation({
				capability: OperationTestCapability, tool: { ...tool, annotations: { readOnlyHint: false } }, input,
				invoke: (service, input, options) => service.echo(input, options),
			}),
		},
		create,
	};
	const adapter = createServiceProviderAdapter(definition);
	const config = { provider: definition.name, readOnly, baseUrl: 'env://OPERATION_TEST_URL' };
	const getEnv = vi.fn(() => 'https://example.test');
	const sqlDriver = vi.fn((): never => { throw new Error('unexpected SQL driver'); });
	const redisDriver = vi.fn((): never => { throw new Error('unexpected Redis driver'); });
	const fetch = vi.fn<typeof globalThis.fetch>();
	const client = await adapter.create({ name: 'test', config, context: { services: { test: config } }, getEnv, sqlDriver, redisDriver, fetch });
	return { adapter, client, definition, create, service, getEnv, sqlDriver, redisDriver, fetch };
}

describe('registered service operations', () => {
	it('exposes and invokes a custom capability using registration alone, then closes once', async () => {
		const test = await fixture();
		expect(Object.keys((await test.client.getSchema()).tools)).toEqual(['echo', 'write']);
		expect(test.create).not.toHaveBeenCalled();
		expect(test.getEnv).not.toHaveBeenCalled();
		const options = { signal: new AbortController().signal };
		await expect(test.client.call('echo', { value: 'hello' }, options)).resolves.toEqual({ value: 'hello' });
		expect(test.service.echo).toHaveBeenCalledExactlyOnceWith({ value: 'hello' }, options);
		expect(test.getEnv).toHaveBeenCalledExactlyOnceWith('OPERATION_TEST_URL');
		await test.client.close?.();
		await test.client.close?.();
		expect(test.service.close).toHaveBeenCalledTimes(1);
		await expect(test.client.call('echo', { value: 'closed' })).rejects.toThrow('closed');
	});

	it.each(['unknown', 'input', 'readonly', 'cancelled'])('rejects %s before loading, env, drivers or network', async (kind) => {
		const test = await fixture();
		const controller = new AbortController();
		if (kind === 'cancelled') controller.abort(new Error('cancelled'));
		await expect(test.client.call(kind === 'unknown' ? 'toString' : kind === 'readonly' ? 'write' : 'echo',
			kind === 'input' ? { value: 42 } : { value: 'hello' }, { signal: controller.signal })).rejects.toThrow();
		for (const fn of [test.create, test.getEnv, test.sqlDriver, test.redisDriver, test.fetch, test.service.echo])
			expect(fn).not.toHaveBeenCalled();
		await test.client.close?.();
	});

	it('does not invoke when cancellation occurs during provider loading', async () => {
		const test = await fixture();
		const controller = new AbortController();
		const reason = new Error('cancelled during load');
		test.create.mockImplementation(async () => {
			controller.abort(reason);
			return { operationTest: test.service };
		});
		await expect(test.client.call('echo', { value: 'hello' }, { signal: controller.signal })).rejects.toBe(reason);
		expect(test.create).toHaveBeenCalledTimes(1);
		expect(test.service.echo).not.toHaveBeenCalled();
		await test.client.close?.();
		expect(test.service.close).toHaveBeenCalledTimes(1);
	});

	it('gates writes using static annotations and allows an explicitly writable service', async () => {
		const test = await fixture(false);
		await expect(test.client.call('write', { value: 'written' })).resolves.toEqual({ value: 'written' });
		await test.client.close?.();
	});

	it('snapshots schema and provider metadata independently of public tools and schema clones', async () => {
		const test = await fixture();
		const original = await test.client.getSchema();
		const changed = await test.client.getSchema();
		changed.tools.echo.inputSchema.type = 'string';
		changed.tools.echo.annotations!.readOnlyHint = false;
		test.adapter.tools!.echo.inputSchema.type = 'number';
		test.adapter.tools!.echo.annotations!.readOnlyHint = false;
		test.definition.operations!.echo.tool.description = 'mutated definition';
		expect(await test.client.getSchema()).toEqual(original);
		expect(test.adapter).toMatchObject({
			title: 'Operation test', description: 'A custom service', documentationUrl: 'https://example.test/operations',
			examples: [{ command: 'example echo hello', description: 'Echo a value.' }],
		});
		expect(test.adapter.examples).not.toBe(test.definition.examples);
		await expect(test.client.call('echo', { value: 'still readable' })).resolves.toEqual({ value: 'still readable' });
		await test.client.close?.();
	});

	it('treats explicit operations as the complete set and no longer falls back to any hardcoded tool table', async () => {
		const create = vi.fn((): never => { throw new Error('must stay static'); });
		// search/fetch/openobserve/apollo have all migrated to defineServiceOperation/operations; without an
		// explicit `operations` field they no longer fall back to any hardcoded tool table.
		expect(createServiceProviderAdapter({ name: 'legacy', provides: ['search', 'fetch'] as const, create }).tools).toEqual({});
		expect(createServiceProviderAdapter({ name: 'oo', provides: ['openobserve'], create }).tools).toEqual({});
		expect(createServiceProviderAdapter({ name: 'apollo', provides: ['apollo'], create }).tools).toEqual({});
		const base = { name: 'legacy', provides: ['search', 'fetch'] as const, create };
		const explicit = createServiceProviderAdapter({ ...base, operations: {} });
		expect(explicit.tools).toEqual({});
		const config = { provider: 'legacy', readOnly: true };
		const client = await explicit.create({ name: 'test', config, context: { services: { test: config } }, fetch: globalThis.fetch });
		expect(await client.getSchema()).toEqual({ tools: {} });
		await expect(client.call('search', { query: 'hello' })).rejects.toThrow('Unknown service operation');
		expect(create).not.toHaveBeenCalled();
		await client.close?.();
	});

	it('rejects capability mismatches and malformed declarations statically', () => {
		const create = vi.fn((): never => { throw new Error('must stay static'); });
		expect(() => createServiceProviderAdapter({ name: 'wrong', provides: ['search'], operations: { echo }, create })).toThrow('Invalid service operation');
		expect(() => createServiceProviderAdapter({ name: 'bad', provides: ['operationTest'], operations: { '': echo }, create })).toThrow('Conflicting service operation');
		expect(() => createServiceProviderAdapter({ name: 'bad', provides: ['operationTest'], operations: { echo: { ...echo, tool: { inputSchema: null! } } }, create })).toThrow('Invalid service operation metadata');
		expect(create).not.toHaveBeenCalled();
	});

	it('validates before registry.load even when called through the helper directly', async () => {
		const registry = new ServiceRegistry();
		const load = vi.spyOn(registry, 'load');
		await expect(echo.execute(registry, 'test', { value: 42 })).rejects.toThrow('Invalid service input');
		expect(load).not.toHaveBeenCalled();
		await registry.close();
	});
});

// Compile-time regression checks: neither input nor service binding can drift.
function checkOperationTypes() {
	defineServiceOperation<TestOperationService, { value: string }, { value: string }>({
		capability: OperationTestCapability, tool,
		// @ts-expect-error The validator output must match the invocation input.
		input: z.strictObject({ value: z.number() }),
		invoke: (service, value, options) => service.echo(value, options),
	});
	defineServiceOperation<TestOperationService, { value: string }, { value: string }>({
		capability: OperationTestCapability, tool, input,
		// @ts-expect-error A Redis service cannot implement an operationTest invocation.
		invoke: (service: IRedisService, value, options) => Promise.resolve(value),
	});
	defineServiceOperation({ capability: OperationTestCapability, tool, input, invoke(service, value, options) {
		// @ts-expect-error Inferred validator input is a string, not a number.
		const wrong: number = value.value;
		// @ts-expect-error The capability binding exposes only the operationTest service.
		service.get({ key: 'wrong' }, options);
		return service.echo(value, options);
	} });
	const wrongProvider: ServiceProviderDefinition<ISqlService> = {
		name: 'wrong', provides: [SqlServiceCapability], create: () => { throw new Error('type check only'); },
		// @ts-expect-error Operations must belong to the provider's declared capability.
		operations: { echo },
	};
}
