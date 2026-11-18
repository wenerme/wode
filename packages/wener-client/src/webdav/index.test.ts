import { describe, expect, it, vi } from 'vitest';
import { createWebDavClient, normalizeWebDavPath, WebDavError } from './index';
import { parseXml } from './xml';

const multistatus = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
	<D:response>
		<D:href>/dav/docs/</D:href>
		<D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat>
	</D:response>
	<D:response>
		<D:href>/dav/docs/a%20b.txt</D:href>
		<D:propstat>
			<D:prop>
				<D:resourcetype/>
				<D:getcontentlength>12</D:getcontentlength>
				<D:getlastmodified>Mon, 01 Jan 2024 00:00:00 GMT</D:getlastmodified>
				<D:getetag>"e1"</D:getetag>
				<D:getcontenttype>text/plain</D:getcontenttype>
			</D:prop>
			<D:status>HTTP/1.1 200 OK</D:status>
		</D:propstat>
		<D:propstat><D:prop><D:displayname/></D:prop><D:status>HTTP/1.1 404 Not Found</D:status></D:propstat>
	</D:response>
	<D:response>
		<D:href>https://dav.example.test/dav/docs/sub/</D:href>
		<D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat>
	</D:response>
</D:multistatus>`;

function setup(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
	const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => handler(String(input), init ?? {}));
	const client = createWebDavClient({
		url: 'https://dav.example.test/dav',
		auth: { type: 'basic', username: 'user', password: 'fixture-secret' },
		fetch,
	});
	return { client, fetch };
}

describe('WebDAV XML', () => {
	it('parses namespaces, entities and CDATA', () => {
		const root = parseXml('<?xml version="1.0"?><a:x xmlns:a="DAV:" k="1>2"><!-- c --><a:y>&amp;&#x41;<![CDATA[<z>]]></a:y><a:e/></a:x>');
		expect(root.name).toBe('x');
		expect(root.children.map((c) => c.name)).toEqual(['y', 'e']);
		expect(root.children[0]!.text).toBe('&A<z>');
	});

	it('rejects DOCTYPE and malformed documents', () => {
		expect(() => parseXml('<!DOCTYPE x [<!ENTITY a "b">]><x/>')).toThrow();
		expect(() => parseXml('<a><b></a>')).toThrow();
		expect(() => parseXml('<a>&unknown;</a>')).toThrow();
		expect(() => parseXml('junk<d:multistatus xmlns:d="DAV:"/>')).toThrow();
		expect(() => parseXml('<d:multistatus xmlns:d="DAV:"/>junk')).toThrow();
	});
});

describe('WebDAV client', () => {
	it('rejects traversal and credentials in URL', () => {
		expect(() => normalizeWebDavPath('a/../b')).toThrow(WebDavError);
		expect(() => createWebDavClient({ url: 'https://u:p@dav.example.test/' })).toThrow('without credentials');
	});

	it('lists a collection with PROPFIND depth 1', async () => {
		const { client, fetch } = setup(() => new Response(multistatus, { status: 207 }));
		const entries = await client.list('docs');
		const [url, init] = fetch.mock.calls[0]!;
		expect(url).toBe('https://dav.example.test/dav/docs');
		expect(init?.method).toBe('PROPFIND');
		expect((init?.headers as Record<string, string>).Depth).toBe('1');
		expect((init?.headers as Record<string, string>).Authorization).toBe(`Basic ${btoa('user:fixture-secret')}`);
		expect(entries).toEqual([
			{
				path: '/docs/a b.txt',
				name: 'a b.txt',
				type: 'file',
				size: 12,
				lastModified: '2024-01-01T00:00:00.000Z',
				etag: '"e1"',
				contentType: 'text/plain',
			},
			{ path: '/docs/sub', name: 'sub', type: 'directory' },
		]);
	});

	it('stat returns null on 404 and uses depth 0', async () => {
		const { client, fetch } = setup(() => new Response('missing', { status: 404 }));
		await expect(client.stat('nope')).resolves.toBeNull();
		expect((fetch.mock.calls[0]![1]?.headers as Record<string, string>).Depth).toBe('0');
	});

	it('reads bytes with a size bound', async () => {
		const { client } = setup(() => new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'application/octet-stream' } }));
		const result = await client.read('f.bin');
		expect([...result.data]).toEqual([1, 2, 3]);
		await expect(client.read('f.bin', { maxBytes: 2 })).rejects.toThrow('exceeds 2 bytes');
	});

	it('writes, mkdirs, removes, moves and copies with proper headers', async () => {
		const { client, fetch } = setup(() => new Response(null, { status: 201, headers: { etag: '"n"' } }));
		await expect(client.write('a.txt', 'hi', { overwrite: false, contentType: 'text/plain' })).resolves.toEqual({ etag: '"n"' });
		await client.mkdir('dir');
		await client.remove('a.txt');
		await client.move('a.txt', 'b.txt');
		await client.copy('b.txt', 'c.txt', { overwrite: true });
		const calls = fetch.mock.calls.map(([url, init]) => [init?.method, url, init?.headers as Record<string, string>] as const);
		expect(calls[0]![2]['If-None-Match']).toBe('*');
		expect(calls[1]!.slice(0, 2)).toEqual(['MKCOL', 'https://dav.example.test/dav/dir/']);
		expect(calls[2]![0]).toBe('DELETE');
		expect(calls[3]![2]).toMatchObject({ Destination: 'https://dav.example.test/dav/b.txt', Overwrite: 'F' });
		expect(calls[4]![2]).toMatchObject({ Overwrite: 'T' });
		await expect(client.remove('/')).rejects.toThrow('root');
	});

	it('never echoes credentials or transport errors', async () => {
		const { client } = setup(() => {
			throw new Error('connect failed Authorization: Basic fixture-secret');
		});
		const error = (await client.list('/').catch((e: unknown) => e)) as Error;
		expect(error.message).toBe('WebDAV PROPFIND request failed');
		const { client: c2 } = setup(() => new Response('fixture-secret body', { status: 401 }));
		const e2 = (await c2.read('x').catch((e: unknown) => e)) as WebDavError;
		expect(e2.message).not.toContain('fixture-secret');
		expect(e2.status).toBe(401);
	});

	it('uses bearer auth and honors abort', async () => {
		const fetch = vi.fn(async (_: RequestInfo | URL, init?: RequestInit) => {
			expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer tok');
			return new Response(multistatus, { status: 207 });
		});
		const client = createWebDavClient({ url: 'https://dav.example.test/dav/', auth: { type: 'bearer', token: 'tok' }, fetch });
		await client.list('docs');
		const controller = new AbortController();
		controller.abort(new Error('stop'));
		await expect(client.list('docs', { signal: controller.signal })).rejects.toThrow('stop');
	});

	it('caps PROPFIND response size and cancels the stream', async () => {
		let cancelled = false;
		const fetch = vi.fn(async () => new Response(new ReadableStream<Uint8Array>({
			pull(controller) { controller.enqueue(new Uint8Array(64)); },
			cancel() { cancelled = true; },
		}), { status: 207 }));
		const client = createWebDavClient({ url: 'https://dav.example.test/dav/', fetch, maxPropfindBytes: 256 });
		const error = (await client.list('/').catch((e: unknown) => e)) as WebDavError;
		expect(error).toBeInstanceOf(WebDavError);
		expect(error.message).toContain('exceeds 256 bytes');
		expect(cancelled).toBe(true);
	});

	it('drops unsafe, encoded-slash and foreign-origin hrefs', async () => {
		const resp = (href: string) => `<d:response><d:href>${href}</d:href><d:propstat><d:prop><d:resourcetype/></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`;
		const xml = `<d:multistatus xmlns:d="DAV:">${[
			'/dav/%2F..%2Fetc', '/dav/a%2Fb.txt', '/dav/%2E%2E', 'https://other.example.test/dav/x.txt', '/dav/ok.txt',
		].map(resp).join('')}</d:multistatus>`;
		const { client } = setup(() => new Response(xml, { status: 207 }));
		expect((await client.list('/')).map((e) => e.path)).toEqual(['/ok.txt']);
	});

	it('sends no precondition for overwrite=true and surfaces 412', async () => {
		const { client, fetch } = setup(() => new Response(null, { status: 412 }));
		const error = (await client.write('a.txt', 'x', { overwrite: false }).catch((e: unknown) => e)) as WebDavError;
		expect(error.status).toBe(412);
		const ok = setup(() => new Response(null, { status: 204 }));
		await ok.client.write('a.txt', 'x', { overwrite: true });
		expect((ok.fetch.mock.calls[0]![1]?.headers as Record<string, string>)['If-None-Match']).toBeUndefined();
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});
