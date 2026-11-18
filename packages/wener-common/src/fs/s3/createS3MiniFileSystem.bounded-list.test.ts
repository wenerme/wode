import { S3mini } from 's3mini';
import { describe, expect, test, vi } from 'vitest';
import { createOverlayFileSystem } from '../createOverlayFileSystem';
import { createS3MiniFileSystem } from './createS3MiniFileSystem';

function listing(contents: string, next?: string) {
	return new Response(
		`<ListBucketResult><IsTruncated>${Boolean(next)}</IsTruncated>${next ? `<NextContinuationToken>${next}</NextContinuationToken>` : ''}${contents}</ListBucketResult>`,
	);
}

const object = (key: string) => `<Contents><Key>${key}</Key><Size>1</Size></Contents>`;

function setup(respond: (url: URL, init?: RequestInit) => Response) {
	const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => respond(new URL(String(input)), init));
	const client = new S3mini({
		endpoint: 'https://s3.example.test/bucket',
		accessKeyId: 'test',
		secretAccessKey: 'test',
		fetch,
	});
	return {
		fs: createS3MiniFileSystem({ client, url: 'https://s3.example.test/bucket?pathStyle=true' }),
		client,
		fetch,
	};
}

describe('bounded S3 direct directory listing', () => {
	test.each(['stat', 'readdir'] as const)(
		'cancels %s transport and prevents subsequent metadata/page requests',
		async (method) => {
			let transportSignal: AbortSignal | undefined;
			let started!: () => void;
			const ready = new Promise<void>((resolve) => {
				started = resolve;
			});
			const fetch = vi.fn(
				(_input: RequestInfo | URL, init?: RequestInit) =>
					new Promise<Response>((_resolve, reject) => {
						transportSignal = init?.signal ?? undefined;
						started();
						transportSignal?.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
					}),
			);
			const createClient = (signal?: AbortSignal) =>
				new S3mini({
					endpoint: 'https://s3.example.test/bucket',
					accessKeyId: 'test',
					secretAccessKey: 'test',
					fetch: (input, init) => {
						signal?.throwIfAborted();
						return fetch(input, {
							...init,
							signal: signal && init?.signal ? AbortSignal.any([signal, init.signal]) : (signal ?? init?.signal),
						});
					},
					logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
				});
			const fs = createS3MiniFileSystem({
				client: createClient(),
				createReadClient: createClient,
				url: 'https://s3.example.test/bucket?pathStyle=true',
			});
			const controller = new AbortController();
			const pending = fs[method]('/media', { signal: controller.signal });
			const rejected = expect(pending).rejects.toThrow();
			await ready;
			expect(transportSignal).toBeDefined();
			controller.abort();
			await rejected;
			expect(transportSignal?.aborted).toBe(true);
			expect(fetch).toHaveBeenCalledOnce();
		},
	);

	test('requests maxEntries + 1 and returns a complete directory within the limit', async () => {
		const { fs, fetch } = setup((url) => {
			expect(url.searchParams.get('max-keys')).toBe('3');
			expect(url.searchParams.get('prefix')).toBe('media/');
			expect(url.searchParams.get('delimiter')).toBe('/');
			return listing(`${object('media/song.mp3')}<CommonPrefixes><Prefix>media/videos/</Prefix></CommonPrefixes>`);
		});
		expect((await fs.readdir('/media', { maxEntries: 2, recursive: false })).map((entry) => entry.name)).toEqual([
			'videos',
			'song.mp3',
		]);
		expect(fetch).toHaveBeenCalledOnce();
	});

	test('stops at the raw limit despite a continuation token and rejects before filtering', async () => {
		const { fs, fetch } = setup((url) => {
			expect(url.searchParams.get('max-keys')).toBe('3');
			return listing(
				`${object('media/.one')}${object('media/.two')}<CommonPrefixes><Prefix>media/.hidden/</Prefix></CommonPrefixes>`,
				'more-objects',
			);
		});
		await expect(fs.readdir('/media', { maxEntries: 2, recursive: false, hidden: false })).rejects.toMatchObject({
			code: 'EFBIG',
			message: 'Directory entry limit exceeded',
		});
		expect(fetch).toHaveBeenCalledOnce();
	});

	test('preserves pagination for an unlimited listing', async () => {
		const { fs, fetch } = setup((url) => {
			expect(url.searchParams.get('max-keys')).toBe('1000');
			return url.searchParams.has('continuation-token')
				? listing(object('media/second.mp3'))
				: listing(object('media/first.mp3'), 'second-page');
		});
		expect((await fs.readdir('/media')).map((entry) => entry.name)).toEqual(['first.mp3', 'second.mp3']);
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	test('accepts a zero limit for an empty directory', async () => {
		const { fs, fetch } = setup((url) => {
			expect(url.searchParams.get('max-keys')).toBe('1');
			return listing('');
		});
		await expect(fs.readdir('/media', { maxEntries: 0 })).resolves.toEqual([]);
		expect(fetch).toHaveBeenCalledOnce();
	});

	test.each([object('media/.hidden'), '<CommonPrefixes><Prefix>media/.hidden/</Prefix></CommonPrefixes>'])(
		'rejects a nonempty directory with a zero limit before filtering: %s',
		async (contents) => {
			const { fs, fetch } = setup((url) => {
				expect(url.searchParams.get('max-keys')).toBe('1');
				return listing(contents, 'more-objects');
			});
			await expect(fs.readdir('/media', { maxEntries: 0, hidden: false, glob: '**/*.mp3' })).rejects.toMatchObject({
				code: 'EFBIG',
				message: 'Directory entry limit exceeded',
			});
			expect(fetch).toHaveBeenCalledOnce();
		},
	);

	test('rejects invalid limits and unsupported recursive requests before listing', async () => {
		const { fs, fetch } = setup(() => {
			throw new Error('unexpected fetch');
		});
		for (const maxEntries of [-1, 1.5, NaN, Infinity, -Infinity]) {
			await expect(fs.readdir('/media', { maxEntries })).rejects.toMatchObject({ code: 'EINVAL' });
		}
		await expect(fs.readdir('/media', { maxEntries: Number.MAX_SAFE_INTEGER })).rejects.toBeInstanceOf(RangeError);
		for (const options of [{ recursive: true }, { depth: 2 }]) {
			await expect(fs.readdir('/media', { maxEntries: 2, ...options })).rejects.toMatchObject({ code: 'ENOTSUP' });
		}
		expect(fetch).not.toHaveBeenCalled();
	});
});

describe('S3 SDK directory operations and overlay compatibility', () => {
	function directory(shallow = false) {
		return setup((url, init) => {
			if (init?.method === 'HEAD') return new Response(null, { status: 404 });
			if (init?.method === 'DELETE') return new Response(null, { status: 204 });
			if (init?.method === 'PUT') return new Response('<CopyObjectResult><ETag>"copied"</ETag></CopyObjectResult>');
			if (init?.method === 'POST') {
				return new Response('<DeleteResult><Deleted><Key>media/sub/song.mp3</Key></Deleted></DeleteResult>');
			}
			expect(url.pathname).toBe('/bucket/');
			expect(url.searchParams.get('prefix')).toBe('media/');
			if (url.searchParams.get('max-keys') !== '1') {
				expect(url.searchParams.get('delimiter')).toBe(shallow ? '/' : '');
			}
			return listing(object(shallow ? 'media/song.mp3' : 'media/sub/song.mp3'));
		});
	}

	test('recursively removes nested objects through the real SDK', async () => {
		const { fs, fetch } = directory();
		await fs.rm('/media', { recursive: true });
		expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true);
		expect(
			fetch.mock.calls.some(([input, init]) => init?.method === 'DELETE' && String(input).endsWith('/media/')),
		).toBe(true);
	});

	test('renames a directory and its nested objects through the real SDK', async () => {
		const { fs, fetch } = directory();
		await fs.rename('/media', '/archive', { overwrite: true });
		expect(
			fetch.mock.calls.some(
				([input, init]) => init?.method === 'PUT' && String(input).endsWith('/archive/sub/song.mp3'),
			),
		).toBe(true);
		expect(
			fetch.mock.calls.some(
				([input, init]) => init?.method === 'DELETE' && String(input).endsWith('/media/sub/song.mp3'),
			),
		).toBe(true);
	});

	test.each([false, true])('copies a directory through the real SDK with shallow=%s', async (shallow) => {
		const { fs, fetch } = directory(shallow);
		await fs.copy('/media', '/archive', { shallow });
		const suffix = shallow ? '/archive/song.mp3' : '/archive/sub/song.mp3';
		expect(fetch.mock.calls.some(([input, init]) => init?.method === 'PUT' && String(input).endsWith(suffix))).toBe(
			true,
		);
	});

	test('returns ENOENT when both object and directory probes miss', async () => {
		const { fs } = setup((_url, init) => (init?.method === 'HEAD' ? new Response(null, { status: 404 }) : listing('')));
		await expect(fs.stat('/missing.txt')).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('normalizes SDK NoSuchKey without swallowing other failures', async () => {
		const { fs, client } = setup(() => {
			throw new Error('unexpected fetch');
		});
		const probe = vi.spyOn(client, 'objectExists');
		probe.mockRejectedValueOnce(Object.assign(new Error('Object is missing'), { code: 'NoSuchKey' }));
		await expect(fs.stat('/missing.txt')).rejects.toMatchObject({ code: 'ENOENT' });
		const failure = new Error('transport failure');
		probe.mockRejectedValueOnce(failure);
		await expect(fs.stat('/missing.txt')).rejects.toBe(failure);
	});

	test('allows an overlay to create a new file above an empty S3 lower layer', async () => {
		const { fs: lower, fetch } = setup((_url, init) =>
			init?.method === 'HEAD' ? new Response(null, { status: 404 }) : listing(''),
		);
		const fs = createOverlayFileSystem({ lower });
		await fs.writeFile('/new.txt', 'new content');
		expect(await fs.readFile('/new.txt', { encoding: 'text' })).toBe('new content');
		expect(fetch.mock.calls.every(([, init]) => init?.method === 'HEAD' || init?.method === 'GET')).toBe(true);
	});
});
