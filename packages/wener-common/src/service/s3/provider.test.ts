import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import { S3ServiceProvider } from './index';

function listObjectsXml() {
	return `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
	<Name>bucket</Name>
	<Prefix></Prefix>
	<IsTruncated>false</IsTruncated>
	<Contents>
		<Key>foo.txt</Key>
		<LastModified>2024-01-01T00:00:00.000Z</LastModified>
		<ETag>"abc"</ETag>
		<Size>3</Size>
		<StorageClass>STANDARD</StorageClass>
	</Contents>
</ListBucketResult>`;
}

function runtime(
	options: Record<string, unknown> = {
		url: 'https://s3.example.test',
		bucket: 'bucket',
		accessKeyIdEnv: 'S3_FIXTURE_KEY_ID',
		secretAccessKeyEnv: 'S3_FIXTURE_SECRET',
	},
	readOnly = true,
	fetchImpl?: FetchLike,
) {
	const getEnv = vi.fn((name: string) => {
		if (name === 'S3_FIXTURE_KEY_ID') return 'fixture-key';
		if (name === 'S3_FIXTURE_SECRET') return 'fixture-secret';
		return undefined;
	});
	const fetch = vi.fn<FetchLike>(
		fetchImpl ??
			(async () => new Response(listObjectsXml(), { status: 200, headers: { 'content-type': 'application/xml' } })),
	);
	const service = normalizeCliServices([{ name: 'store', type: 's3', readOnly, options }]);
	const rt = createServiceRuntime({
		context: { services: service },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(S3ServiceProvider)]),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	return { runtime: rt, fetch, getEnv };
}

describe('S3 service provider', () => {
	it('discovers a complete schema without env or network access', async () => {
		const test = runtime();
		const schema = await test.runtime.getSchema({ params: { service: 'store' } });
		expect(Object.keys(schema.tools)).toEqual(['listObject', 'getObject', 'putObject', 'deleteObject']);
		expect(schema.tools.listObject.annotations?.readOnlyHint).toBe(true);
		expect(schema.tools.getObject.annotations?.readOnlyHint).toBe(true);
		expect(schema.tools.putObject.annotations?.readOnlyHint).toBe(false);
		expect(schema.tools.deleteObject.annotations?.readOnlyHint).toBe(false);
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('resolves env only on dispatch and lists objects', async () => {
		const test = runtime();
		const result = await test.runtime.call({ params: { service: 'store' }, body: { toolName: 'listObject', input: {} } });
		expect(result).toMatchObject([{ Key: 'foo.txt' }]);
		expect(test.getEnv).toHaveBeenCalledWith('S3_FIXTURE_KEY_ID');
		expect(test.getEnv).toHaveBeenCalledWith('S3_FIXTURE_SECRET');
		await test.runtime.close();
	});

	it('reads an object as text', async () => {
		const test = runtime(undefined, true, async () => new Response('hello world', { status: 200 }));
		const result = await test.runtime.call({
			params: { service: 'store' },
			body: { toolName: 'getObject', input: { key: 'foo.txt' } },
		});
		expect(result).toBe('hello world');
		await test.runtime.close();
	});

	it('returns null when the object is not found', async () => {
		const test = runtime(undefined, true, async () => new Response(null, { status: 404 }));
		const result = await test.runtime.call({
			params: { service: 'store' },
			body: { toolName: 'getObject', input: { key: 'missing.txt' } },
		});
		expect(result).toBeNull();
		await test.runtime.close();
	});

	it('rejects writes when the service is read-only', async () => {
		const test = runtime(undefined, true);
		await expect(
			test.runtime.call({
				params: { service: 'store' },
				body: { toolName: 'putObject', input: { key: 'foo.txt', content: 'hi' } },
			}),
		).rejects.toThrow('read-only');
		await expect(
			test.runtime.call({
				params: { service: 'store' },
				body: { toolName: 'deleteObject', input: { key: 'foo.txt' } },
			}),
		).rejects.toThrow('read-only');
	});

	it('allows writes when the service is configured writable', async () => {
		const test = runtime(
			undefined,
			false,
			async () => new Response(null, { status: 200, headers: { etag: '"abc"' } }),
		);
		const result = await test.runtime.call({
			params: { service: 'store' },
			body: { toolName: 'putObject', input: { key: 'foo.txt', content: 'hi' } },
		});
		expect(result).toMatchObject({ ok: true, status: 200, etag: '"abc"' });
		await test.runtime.close();
	});

	it('deletes an object when writable', async () => {
		const test = runtime(undefined, false, async () => new Response(null, { status: 204 }));
		const result = await test.runtime.call({
			params: { service: 'store' },
			body: { toolName: 'deleteObject', input: { key: 'foo.txt' } },
		});
		expect(result).toBe(true);
		await test.runtime.close();
	});

	it('rejects configuration missing credential env names', async () => {
		const test = runtime({ url: 'https://s3.example.test', bucket: 'bucket' });
		await expect(
			test.runtime.call({ params: { service: 'store' }, body: { toolName: 'listObject', input: {} } }),
		).rejects.toThrow();
	});

	it('rejects a url without a bucket', async () => {
		const test = runtime({
			url: 'https://s3.example.test',
			accessKeyIdEnv: 'S3_FIXTURE_KEY_ID',
			secretAccessKeyEnv: 'S3_FIXTURE_SECRET',
		});
		await expect(
			test.runtime.call({ params: { service: 'store' }, body: { toolName: 'listObject', input: {} } }),
		).rejects.toThrow('Failed to create service');
	});

	it('never exposes credentials in the constructed endpoint URL', async () => {
		const getEnv = (name: string) => (name === 'S3_FIXTURE_KEY_ID' ? 'fixture-key' : name === 'S3_FIXTURE_SECRET' ? 'fixture-secret' : undefined);
		const { s3 } = await S3ServiceProvider.create({
			name: 'store',
			config: {
				provider: 's3',
				readOnly: true,
				options: {
					url: 'https://s3.example.test',
					bucket: 'bucket',
					accessKeyIdEnv: 'S3_FIXTURE_KEY_ID',
					secretAccessKeyEnv: 'S3_FIXTURE_SECRET',
				},
			},
			context: { services: {} },
			fetch: globalThis.fetch,
			getEnv,
		});
		expect(s3.endpoint.toString()).not.toContain('fixture-key');
		expect(s3.endpoint.toString()).not.toContain('fixture-secret');
		expect(s3.endpoint.username).toBe('');
		expect(s3.endpoint.password).toBe('');
		await s3.close();
	});
});
