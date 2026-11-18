import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ServiceProviderContext } from '../runtime/types';
import { S3ServiceOptionsSchema, S3ServiceProvider } from './index';

const configOptions = {
	url: 'https://s3.example.test/bucket', accessKeyIdEnv: 'S3_KEY', secretAccessKeyEnv: 'S3_SECRET',
};
function local(fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('text')), readOnly = true) {
	const context: ServiceProviderContext = {
		name: 'store', config: { provider: 's3', readOnly, options: configOptions }, context: { services: {} }, fetch,
		getEnv: vi.fn((name: string) => name === 'S3_KEY' ? 'fixture-key' : 'fixture-secret'),
	};
	return { create: async () => (await S3ServiceProvider.create(context)).s3, fetch, context };
}
afterEach(() => vi.useRealTimers());

describe('S3 local provider contract and lifecycle', () => {
	it('requires env references and rejects embedded credentials and invalid URLs', () => {
		for (const missing of ['accessKeyIdEnv', 'secretAccessKeyEnv'] as const) {
			const { [missing]: _, ...value } = configOptions;
			expect(S3ServiceOptionsSchema.safeParse(value).success).toBe(false);
		}
		for (const url of ['https://key:secret@s3.test/bucket', 'https://key@s3.test/bucket', 'https://key:secret@', 'file:///bucket'])
			expect(S3ServiceOptionsSchema.safeParse({ ...configOptions, url }).success).toBe(false);
	});

	it('fails without a bucket or available credentials without leaking the configuration', async () => {
		const test = local();
		test.context.config.options = { ...configOptions, url: 'https://s3.example.test' };
		await expect(test.create()).rejects.toThrow('S3 service requires a bucket');
		test.context.config.options = configOptions;
		test.context.getEnv = () => undefined;
		await expect(test.create()).rejects.toThrow('credential environment variable is unavailable');
		expect(test.fetch).not.toHaveBeenCalled();
	});

	it('retains endpoint identity and local read-only guards independently of the runtime adapter', async () => {
		const test = local();
		const service = await test.create();
		expect(service.endpoint.username).toBe('');
		expect(service.endpoint.password).toBe('');
		expect(service.bucketName).toBe('bucket');
		expect(service.region).toBe('auto');
		await expect(service.putObject({ key: 'file', content: 'x' })).rejects.toThrow('read-only');
		await expect(service.deleteObject({ key: 'file' })).rejects.toThrow('read-only');
		expect(test.fetch).not.toHaveBeenCalled();
		await service.close();
	});

	it('uses the default list input and preserves metadata in JSON without losing dates', async () => {
		const test = local(vi.fn(async () => new Response(`
			<ListBucketResult><IsTruncated>false</IsTruncated>
			<Contents><Key>file</Key><Size>3</Size><LastModified>2026-11-12T00:00:00.000Z</LastModified><ETag>"etag"</ETag><StorageClass>STANDARD</StorageClass></Contents>
			<CommonPrefixes><Prefix>folder/</Prefix></CommonPrefixes></ListBucketResult>`)));
		const service = await test.create();
		const objects = await service.listObject();
		expect(objects).toMatchObject([
			{ Key: 'file', Size: 3, LastModified: '2026-11-12T00:00:00.000Z', ETag: '"etag"', StorageClass: 'STANDARD' },
			{ Key: 'folder/', Size: 0, LastModified: '1970-01-01T00:00:00.000Z' },
		]);
		expect(JSON.parse(JSON.stringify(objects))).toEqual(objects);
		await service.close();
	});

	it('matches the SDK JSON semantics for an invalid metadata date', async () => {
		const test = local(vi.fn(async () => new Response('<ListBucketResult><Contents><Key>x</Key><Size>0</Size><LastModified>invalid</LastModified></Contents></ListBucketResult>')));
		const service = await test.create();
		expect(await service.listObject()).toMatchObject([{ LastModified: null }]);
		await service.close();
	});

	it.each(['', '你好\u0000text'])('decodes UTF-8 text including empty objects without returning bytes (%j)', async (text) => {
		const test = local(vi.fn(async () => new Response(new TextEncoder().encode(text))));
		const service = await test.create();
		expect(await service.getObject({ key: 'file' })).toBe(text);
		await service.close();
	});

	it('validates typed requests before any network call', async () => {
		const test = local();
		const service = await test.create();
		await expect(service.getObject({ key: '', encoding: 'base64' } as never)).rejects.toThrow();
		await expect(service.listObject({ maxKeys: 0 })).rejects.toThrow();
		expect(test.fetch).not.toHaveBeenCalled();
		await service.close();
	});

	it('prevents already-cancelled calls from entering the SDK', async () => {
		const test = local();
		const service = await test.create();
		await expect(service.getObject({ key: 'file' }, { signal: AbortSignal.abort(new Error('Stopped')) })).rejects.toThrow('Stopped');
		expect(test.fetch).not.toHaveBeenCalled();
		await service.close();
	});

	it.each(['abort', 'timeout', 'close'] as const)('forwards %s to the underlying fetch and settles pending callers', async (mode) => {
		vi.useFakeTimers();
		const pending = Promise.withResolvers<Response>();
		const started = Promise.withResolvers<void>();
		const fetch = vi.fn<typeof globalThis.fetch>(() => { started.resolve(); return pending.promise; });
		const service = await local(fetch).create();
		const caller = new AbortController();
		const result = service.getObject({ key: 'file' }, { signal: caller.signal, context: mode === 'timeout' ? { timeoutMs: 10 } : {} });
		const rejected = expect(result).rejects.toThrow(mode === 'abort' ? 'Stopped' : mode === 'timeout' ? 'timed out' : 'closed');
		await started.promise;
		if (mode === 'abort') caller.abort(new Error('Stopped'));
		if (mode === 'timeout') await vi.advanceTimersByTimeAsync(10);
		if (mode === 'close') await service[Symbol.asyncDispose]();
		await rejected;
		expect(fetch.mock.calls[0]![1]?.signal?.aborted).toBe(true);
		expect(String(fetch.mock.calls[0]![0])).not.toContain('signal=');
		expect(vi.getTimerCount()).toBe(0);
		pending.resolve(new Response('late'));
		await service.close();
	});

	it('reuses close and rejects new operations after disposal', async () => {
		const test = local();
		const service = await test.create();
		const close = service.close();
		expect(service.close()).toBe(close);
		await service[Symbol.asyncDispose]();
		await expect(service.getObject({ key: 'file' })).rejects.toThrow('closed');
		expect(test.fetch).not.toHaveBeenCalled();
	});

	it('does not echo provider error bodies containing credentials or signed URLs', async () => {
		const test = local(vi.fn(async () => new Response('<Error>fixture-secret https://key:secret@s3.test/bucket</Error>', { status: 403 })));
		const service = await test.create();
		await expect(service.getObject({ key: 'file' })).rejects.toThrow(/^S3 operation failed$/u);
		await service.close();
	});
});
