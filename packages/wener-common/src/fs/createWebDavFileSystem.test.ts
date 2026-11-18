import { describe, expect, it } from 'vitest';
import { createWebDavFileSystem, WebDavFileSystemError } from './createWebDavFileSystem';
import { createWebDavMockServer } from './tests/createWebDavMockServer';
import { runFileSystemTest } from './tests/runFileSystemTest';

function setup() {
	const server = createWebDavMockServer();
	server.files.set('/README.txt', new TextEncoder().encode('hello'));
	const fs = createWebDavFileSystem({ url: 'https://dav.example.test/dav/', fetch: server.fetch });
	return { server, fs };
}

describe('createWebDavFileSystem', () => {
	it('passes the shared IFileSystem conformance suite', async () => {
		const { fs } = setup();
		await runFileSystemTest(fs);
	});

	it('writes ArrayBufferView and Web ReadableStream data without Node Buffer APIs', async () => {
		const { fs, server } = setup();
		await fs.writeFile('/bytes.bin', new Uint8Array([9, 0, 128, 255]).subarray(1));
		await fs.writeFile('/stream.bin', new ReadableStream({
			start(controller) {
				controller.enqueue(new Uint8Array([1, 2]));
				controller.enqueue(new Uint8Array([3]));
				controller.close();
			},
		}));
		expect([...server.files.get('/bytes.bin')!]).toEqual([0, 128, 255]);
		expect([...server.files.get('/stream.bin')!]).toEqual([1, 2, 3]);
	});

	it('supports readdir glob, kind, hidden, depth, recursive and maxEntries', async () => {
		const { fs } = setup();
		await fs.mkdir('/a/b/c', { recursive: true });
		await fs.writeFile('/notes.txt', 'x');
		await fs.writeFile('/notes.md', 'x');
		await fs.writeFile('/.hidden', 'x');
		await fs.writeFile('/a/b/c/deep.txt', 'x');
		expect((await fs.readdir('/', { glob: '/notes*.txt' })).map((e) => e.name)).toEqual(['notes.txt']);
		expect((await fs.readdir('/', { kind: 'directory' })).map((e) => e.path)).toEqual(['/a']);
		expect((await fs.readdir('/', { hidden: true })).map((e) => e.name)).toContain('.hidden');
		expect((await fs.readdir('/', { depth: 2 })).map((e) => e.path)).toContain('/a/b');
		expect((await fs.readdir('/', { depth: 2 })).map((e) => e.path)).not.toContain('/a/b/c');
		expect((await fs.readdir('/', { recursive: true })).map((e) => e.path)).toContain('/a/b/c/deep.txt');
		await expect(fs.readdir('/', { maxEntries: 1 })).rejects.toMatchObject({ code: 'EOVERFLOW' });
		await expect(fs.readdir('/notes.txt')).rejects.toMatchObject({ code: 'ENOTDIR' });
	});

	it('bounds readFile by maxBytes and cancels the transfer', async () => {
		const { fs } = setup();
		await fs.writeFile('/a.txt', 'abcdef');
		expect(await fs.readFile('/a.txt', { encoding: 'text', maxBytes: 3 })).toBe('abc');
		expect([...(await fs.readFile('/a.txt', { maxBytes: 0 }))]).toEqual([]);
		await expect(fs.readFile('/a.txt', { maxBytes: -1 })).rejects.toMatchObject({ code: 'EINVAL' });
	});

	it('maps rename/copy overwrite and shallow copies to headers', async () => {
		const { fs, server } = setup();
		await fs.writeFile('/x.txt', '1');
		await fs.writeFile('/y.txt', '2');
		await expect(fs.rename('/x.txt', '/y.txt')).rejects.toMatchObject({ code: 'EEXIST' });
		await fs.rename('/x.txt', '/y.txt', { overwrite: true });
		expect(await fs.readFile('/y.txt', { encoding: 'text' })).toBe('1');
		await fs.mkdir('/d');
		await fs.writeFile('/d/f', 'x');
		await fs.copy('/d', '/e', { shallow: true });
		expect(server.requests.at(-1)!.headers.depth).toBe('0');
		expect(await fs.exists('/e')).toBe(true);
		expect(await fs.exists('/e/f')).toBe(false);
		await expect(fs.rename('/d', '/d/inner')).rejects.toMatchObject({ code: 'EINVAL' });
		await expect(fs.rm('/')).rejects.toMatchObject({ code: 'EBUSY' });
	});

	it('maps HTTP status to codes and never leaks transport errors', async () => {
		const denied = createWebDavFileSystem({
			url: 'https://dav.example.test/',
			auth: { type: 'bearer', token: 'fixture-secret' },
			fetch: async () => new Response('fixture-secret', { status: 403 }),
		});
		const error = (await denied.stat('/x').catch((e: unknown) => e)) as WebDavFileSystemError;
		expect(error).toMatchObject({ code: 'EACCES', status: 403 });
		expect(error.message).not.toContain('fixture-secret');
		const broken = createWebDavFileSystem({
			url: 'https://dav.example.test/',
			fetch: async () => {
				throw new Error('connect https://user:fixture-secret@dav.example.test failed');
			},
		});
		const e2 = (await broken.stat('/x').catch((e: unknown) => e)) as Error;
		expect(e2).toMatchObject({ code: 'EIO' });
		expect(e2.message).not.toContain('fixture-secret');
	});

	it('creates the client lazily', async () => {
		let calls = 0;
		const server = createWebDavMockServer();
		const fs = createWebDavFileSystem({
			client: () => {
				calls++;
				throw new Error('no credentials');
			},
		});
		expect(calls).toBe(0);
		await expect(fs.stat('/')).rejects.toMatchObject({ code: 'EIO' });
		expect(server.requests).toHaveLength(0);
	});

	it('streams with ranges and supports web writable streams', async () => {
		const { fs } = setup();
		const stream = fs.createReadableStream!('/README.txt', { range: { start: 1, end: 3 } });
		expect(await new Response(stream).text()).toBe('ell');
		const writer = fs.createWritableStream!('/w.txt').getWriter();
		await writer.write(new TextEncoder().encode('ok'));
		await writer.close();
		expect(await fs.readFile('/w.txt', { encoding: 'text' })).toBe('ok');
		await expect(new Response(fs.createReadableStream!('/missing')).text()).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('accepts only direct children and does not loop on ancestor/sibling entries', async () => {
		const resp = (href: string, dir = true) => `<d:response><d:href>${href}</d:href><d:propstat><d:prop>${dir ? '<d:resourcetype><d:collection/></d:resourcetype>' : '<d:resourcetype/>'}</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`;
		let calls = 0;
		const fs = createWebDavFileSystem({
			url: 'https://dav.example.test/',
			fetch: async (input) => {
				calls++;
				const path = new URL(String(input)).pathname.replace(/\/$/u, '') || '/';
				// Every listing echoes root, an ancestor, a sibling and a deep entry besides the child.
				const body = [resp(`${path}/`), resp('/'), resp('/a/'), resp('/x/y/z/'), resp(`${path === '/' ? '' : path}/c/`)].join('');
				return new Response(`<d:multistatus xmlns:d="DAV:">${body}</d:multistatus>`, { status: 207 });
			},
			maxVisitedDirectories: 5,
		});
		await expect(fs.readdir('/a/b', { depth: 2 })).resolves.toEqual([
			expect.objectContaining({ path: '/a/b/c' }),
			expect.objectContaining({ path: '/a/b/c/c' }),
		]);
		expect(calls).toBe(2);
		await expect(fs.readdir('/', { recursive: true })).rejects.toMatchObject({ code: 'EOVERFLOW' });
		expect(calls).toBeLessThan(20);
	});

	it('bounds traversal even when filters match nothing', async () => {
		const server = createWebDavMockServer();
		for (let i = 0; i < 30; i++) server.files.set(`/f${i}.txt`, new Uint8Array());
		const fs = createWebDavFileSystem({ url: 'https://dav.example.test/dav/', fetch: server.fetch, maxScannedEntries: 20 });
		await expect(fs.readdir('/', { recursive: true, glob: '/nothing' })).rejects.toMatchObject({ code: 'EOVERFLOW' });
		await expect(fs.readdir('/', { kind: 'directory' })).rejects.toMatchObject({ code: 'EOVERFLOW' });
	});

	it('skips leading bytes when the server ignores Range', async () => {
		const fs = createWebDavFileSystem({
			url: 'https://dav.example.test/',
			fetch: async () => new Response(new TextEncoder().encode('0123456789'), { status: 200 }),
		});
		expect(await new Response(fs.createReadableStream!('/f', { range: { start: 3, end: 5 } })).text()).toBe('345');
		expect(await new Response(fs.createReadableStream!('/f', { range: { start: 8 } })).text()).toBe('89');
	});

	it('starts the PUT lazily and sends nothing when aborted before writing', async () => {
		const { fs, server } = setup();
		const before = server.requests.length;
		const writable = fs.createWritableStream!('/lazy.txt');
		await writable.abort(new Error('cancel'));
		expect(server.requests.length).toBe(before);
		const empty = fs.createWritableStream!('/empty.txt');
		await empty.close();
		expect(server.files.get('/empty.txt')?.byteLength).toBe(0);
	});

	it('reads an empty file through a Range stream (416 fallback)', async () => {
		const { fs, server } = setup();
		server.files.set('/empty.txt', new Uint8Array());
		expect(await new Response(fs.createReadableStream!('/empty.txt', { range: { start: 0, end: 10 } })).text()).toBe('');
		expect(server.requests.filter((r) => r.method === 'GET').map((r) => r.headers.range)).toEqual(['bytes=0-10', undefined]);
		await expect(new Response(fs.createReadableStream!('/README.txt', { range: { start: 99 } })).text()).rejects.toMatchObject({ code: 'EIO' });
	});
});
