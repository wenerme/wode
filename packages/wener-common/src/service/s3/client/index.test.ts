import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ServiceRuntimeClient } from '../../runtime/types';
import { S3ServiceContract } from '../S3ServiceContract';
import { S3ServiceProvider } from '../index';
import { createServiceProviderAdapter } from '../../runtime/createServiceProviderAdapter';
import { createS3ServiceToolClient } from './index';

function fixture() {
	const runtime: ServiceRuntimeClient = {
		getSchema: vi.fn(async () => ({ tools: Object.fromEntries(Object.keys(S3ServiceContract).map((name) => [name, { inputSchema: {} }])) })),
		call: vi.fn(async ({ body }) => {
			switch (body.toolName) {
				case 'listObject': return [];
				case 'getObject': return 'text';
				case 'putObject': return { ok: true, status: 200, etag: '"etag"' };
				case 'deleteObject': return true;
				default: throw new Error('Unknown operation');
			}
		}),
	};
	return { runtime, call: vi.mocked(runtime.call), schema: vi.mocked(runtime.getSchema) };
}

afterEach(() => vi.useRealTimers());

describe('S3 remote contract client', () => {
	it('validates all four operations, applies the list default and forwards the selected service/signal', async () => {
		const test = fixture();
		const signal = new AbortController().signal;
		const client = await createS3ServiceToolClient(test.runtime, 'bucket-service', { signal, readOnly: false });
		expect(test.call).not.toHaveBeenCalled();
		expect(await client.listObject()).toEqual([]);
		expect(await client.getObject({ key: 'file' })).toBe('text');
		expect(await client.putObject({ key: 'file', content: '' })).toEqual({ ok: true, status: 200, etag: '"etag"' });
		expect(await client.deleteObject({ key: 'file' })).toBe(true);
		expect(test.call.mock.calls.map(([input]) => input.body.toolName)).toEqual(Object.keys(S3ServiceContract));
		expect(test.call.mock.calls[0]![0]).toEqual({ params: { service: 'bucket-service' }, body: { toolName: 'listObject', input: {} } });
		for (const [input, options] of test.call.mock.calls) {
			expect(input.params.service).toBe('bucket-service');
			expect(options?.signal).toBeInstanceOf(AbortSignal);
		}
		await client[Symbol.asyncDispose]();
	});

	it('rejects missing operations and invalid input before dispatch', async () => {
		const test = fixture();
		test.schema.mockResolvedValue({ tools: { getObject: { inputSchema: {} } } });
		const client = await createS3ServiceToolClient(test.runtime, 'store');
		await expect(client.listObject()).rejects.toThrow('unavailable');
		await expect(client.getObject({ key: '' })).rejects.toThrow('Invalid S3 input');
		await expect(client.getObject({ key: 'x', encoding: 'base64' } as never)).rejects.toThrow('Invalid S3 input');
		expect(test.call).not.toHaveBeenCalled();
		await client.close();
	});

	it('keeps both write guards active by default', async () => {
		const test = fixture();
		const client = await createS3ServiceToolClient(test.runtime, 'store');
		await expect(client.putObject({ key: 'file', content: 'x' })).rejects.toThrow('read-only');
		await expect(client.deleteObject({ key: 'file' })).rejects.toThrow('read-only');
		expect(test.call).not.toHaveBeenCalled();
		await client.close();
	});

	it.each([
		['listObject', [{ Key: 'missing metadata' }]],
		['getObject', new Uint8Array([1, 255])],
		['getObject', new ArrayBuffer(2)],
		['getObject', { content: 'AQ==', encoding: 'base64' }],
		['putObject', { ok: true }],
		['deleteObject', { deleted: true }],
	] as const)('validates %s output without silently converting invalid transport values', async (name, output) => {
		const test = fixture();
		test.call.mockResolvedValue(output);
		const client = await createS3ServiceToolClient(test.runtime, 'store', { readOnly: false });
		const run = name === 'listObject' ? client.listObject() : name === 'getObject' ? client.getObject({ key: 'file' })
			: name === 'putObject' ? client.putObject({ key: 'file', content: 'x' }) : client.deleteObject({ key: 'file' });
		await expect(run).rejects.toThrow('Invalid S3 response');
		await client.close();
	});

	it('retains dynamic metadata fields in a JSON round trip', async () => {
		const test = fixture();
		const output = [{ Key: 'file', Size: 2, LastModified: '2026-11-12T00:00:00.000Z', ETag: '', StorageClass: '', custom: { nested: [1] } }];
		test.call.mockResolvedValue(JSON.parse(JSON.stringify(output)));
		const client = await createS3ServiceToolClient(test.runtime, 'store');
		expect(await client.listObject()).toEqual(output);
		await client.close();
	});

	it('checks initial and per-call cancellation without dispatch', async () => {
		const test = fixture();
		const aborted = AbortSignal.abort(new Error('Cancelled'));
		await expect(createS3ServiceToolClient(test.runtime, 'store', { signal: aborted })).rejects.toThrow('Cancelled');
		expect(test.schema).not.toHaveBeenCalled();
		const client = await createS3ServiceToolClient(test.runtime, 'store');
		await expect(client.getObject({ key: 'file' }, { signal: aborted })).rejects.toThrow('Cancelled');
		expect(test.call).not.toHaveBeenCalled();
		await client.close();
	});

	it('propagates parent cancellation while an uncooperative transport is pending', async () => {
		const test = fixture();
		const pending = Promise.withResolvers<unknown>();
		const started = Promise.withResolvers<void>();
		test.call.mockImplementation(() => { started.resolve(); return pending.promise; });
		const parent = new AbortController();
		const client = await createS3ServiceToolClient(test.runtime, 'store', { signal: parent.signal });
		const result = client.getObject({ key: 'file' });
		const rejected = expect(result).rejects.toThrow('Caller stopped');
		await started.promise;
		parent.abort(new Error('Caller stopped'));
		await rejected;
		expect(test.call.mock.calls[0]![1]?.signal?.aborted).toBe(true);
		pending.reject(new Error('Late transport error'));
		await client.close();
	});

	it('applies context.timeoutMs to the transport signal and cleans up timers', async () => {
		vi.useFakeTimers();
		const test = fixture();
		const pending = Promise.withResolvers<unknown>();
		const started = Promise.withResolvers<void>();
		test.call.mockImplementation(() => { started.resolve(); return pending.promise; });
		const client = await createS3ServiceToolClient(test.runtime, 'store');
		const result = client.getObject({ key: 'file' }, { context: { timeoutMs: 10 } });
		const rejected = expect(result).rejects.toThrow('timed out');
		await started.promise;
		await vi.advanceTimersByTimeAsync(10);
		await rejected;
		expect(test.call.mock.calls[0]![1]?.signal?.aborted).toBe(true);
		expect(vi.getTimerCount()).toBe(0);
		pending.resolve('late');
		await client.close();
	});

	it.each([0, -1, 1.5, Number.NaN, 3_600_001])('rejects invalid context timeout %s without dispatch', async (timeoutMs) => {
		const test = fixture();
		const client = await createS3ServiceToolClient(test.runtime, 'store');
		await expect(client.getObject({ key: 'file' }, { context: { timeoutMs } })).rejects.toThrow('Invalid S3 timeout');
		expect(test.call).not.toHaveBeenCalled();
		await client.close();
	});

	it('aborts pending work on dispose, reuses close and rejects new calls', async () => {
		const test = fixture();
		const pending = Promise.withResolvers<unknown>();
		const started = Promise.withResolvers<void>();
		test.call.mockImplementation(() => { started.resolve(); return pending.promise; });
		const client = await createS3ServiceToolClient(test.runtime, 'store');
		const rejected = expect(client.getObject({ key: 'file' })).rejects.toThrow('closed');
		await started.promise;
		const close = client.close();
		expect(client.close()).toBe(close);
		await Promise.all([rejected, close, client[Symbol.asyncDispose]()]);
		expect(test.call.mock.calls[0]![1]?.signal?.aborted).toBe(true);
		await expect(client.listObject()).rejects.toThrow('closed');
		pending.resolve('late');
	});

	it('does not repeat signed credentials or URL userinfo from remote errors', async () => {
		const test = fixture();
		test.call.mockRejectedValue(new Error('https://key:secret@s3.test Authorization: fixture-key'));
		const client = await createS3ServiceToolClient(test.runtime, 'store');
		await expect(client.getObject({ key: 'file' })).rejects.toThrow(/^S3 operation failed$/u);
		await client.close();
	});

	it('connects the enhanced remote client to the local provider across JSON transport', async () => {
		const config = { provider: 's3', readOnly: false, options: {
			url: 'https://s3.example.test/bucket', accessKeyIdEnv: 'S3_KEY', secretAccessKeyEnv: 'S3_SECRET',
		} };
		const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('hello'));
		const local = await createServiceProviderAdapter(S3ServiceProvider).create({
			name: 'store', config, context: { services: { store: config } }, fetch, getEnv: () => 'fixture-secret',
		});
		const runtime: ServiceRuntimeClient = {
			getSchema: () => local.getSchema(),
			call: async ({ body }, options) => JSON.parse(JSON.stringify(await local.call(body.toolName, body.input, options))),
		};
		const client = await createS3ServiceToolClient(runtime, 'store', { readOnly: false });
		expect(await client.getObject({ key: 'file' })).toBe('hello');
		await client[Symbol.asyncDispose]();
		await local.close?.();
	});
});
