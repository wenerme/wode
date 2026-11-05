import { describe, expect, it, vi } from 'vitest';
import { ServiceRegistry, type ServiceProviderDefinition } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { type IS3Service, S3ServiceProvider } from './index';
import { S3Operations } from './operations';

describe('S3 registered operations', () => {
	it('covers every existing method with typed input and call options', async () => {
		const service: IS3Service = {
			type: 's3',
			readOnly: true,
			endpoint: new URL('https://s3.example.test/bucket'),
			region: 'auto',
			bucketName: 'bucket',
			listObject: vi.fn(async () => []),
			getObject: vi.fn(async () => 'content'),
			putObject: vi.fn(async () => ({ ok: true, status: 200 })),
			deleteObject: vi.fn(async () => true),
			close: vi.fn(async () => {}),
			[Symbol.asyncDispose]: vi.fn(async () => {}),
		};
		const definition: ServiceProviderDefinition<IS3Service> = { ...S3ServiceProvider, create: () => ({ s3: service }) };
		const registry = new ServiceRegistry({ context: { services: { store: { provider: 's3', readOnly: true } } } });
		registry.register(definition);
		const options = { signal: new AbortController().signal };
		for (const test of [
			{ operation: S3Operations.listObject, input: {}, invoke: service.listObject, args: [{}, options] },
			{ operation: S3Operations.getObject, input: { key: 'foo.txt' }, invoke: service.getObject, args: [{ key: 'foo.txt' }, options] },
			{
				operation: S3Operations.putObject,
				input: { key: 'foo.txt', content: 'hi' },
				invoke: service.putObject,
				args: [{ key: 'foo.txt', content: 'hi' }, options],
			},
			{
				operation: S3Operations.deleteObject,
				input: { key: 'foo.txt' },
				invoke: service.deleteObject,
				args: [{ key: 'foo.txt' }, options],
			},
		]) {
			await test.operation.execute(registry, 'store', test.input, options);
			expect(test.invoke).toHaveBeenCalledExactlyOnceWith(...test.args);
		}
		const tools = createServiceProviderAdapter(definition).tools!;
		expect(Object.keys(S3Operations)).toEqual(Object.keys(tools));
		expect(tools.listObject.annotations).toEqual({ readOnlyHint: true, destructiveHint: false });
		expect(tools.getObject.annotations).toEqual({ readOnlyHint: true, destructiveHint: false });
		expect(tools.putObject.annotations).toEqual({ readOnlyHint: false, destructiveHint: true });
		expect(tools.deleteObject.annotations).toEqual({ readOnlyHint: false, destructiveHint: true });
		await registry.close();
		expect(service.close).toHaveBeenCalledTimes(1);
	});

	it.each(['unknown', 'input', 'cancelled'])('rejects %s before credentials or HTTP', async (kind) => {
		const config = {
			provider: 's3',
			readOnly: true,
			options: {
				url: 'https://s3.example.test',
				bucket: 'bucket',
				accessKeyIdEnv: 'S3_TEST_KEY_ID',
				secretAccessKeyEnv: 'S3_TEST_SECRET',
			},
		};
		const getEnv = vi.fn(() => 'fixture-value');
		const fetch = vi.fn<typeof globalThis.fetch>();
		const client = await createServiceProviderAdapter(S3ServiceProvider).create({
			name: 'store',
			config,
			context: { services: { store: config } },
			fetch,
			getEnv,
		});
		const controller = new AbortController();
		if (kind === 'cancelled') controller.abort();
		await expect(
			client.call(
				kind === 'unknown' ? 'missing' : 'getObject',
				kind === 'input' ? {} : { key: 'foo.txt' },
				{ signal: controller.signal },
			),
		).rejects.toThrow();
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		await client.close?.();
	});

	it('rejects writes from a read-only configured service before HTTP', async () => {
		const config = {
			provider: 's3',
			readOnly: true,
			options: {
				url: 'https://s3.example.test',
				bucket: 'bucket',
				accessKeyIdEnv: 'S3_TEST_KEY_ID',
				secretAccessKeyEnv: 'S3_TEST_SECRET',
			},
		};
		const getEnv = vi.fn(() => 'fixture-value');
		const fetch = vi.fn<typeof globalThis.fetch>();
		const client = await createServiceProviderAdapter(S3ServiceProvider).create({
			name: 'store',
			config,
			context: { services: { store: config } },
			fetch,
			getEnv,
		});
		await expect(client.call('putObject', { key: 'foo.txt', content: 'hi' })).rejects.toThrow('read-only');
		expect(fetch).not.toHaveBeenCalled();
		await client.close?.();
	});
});
