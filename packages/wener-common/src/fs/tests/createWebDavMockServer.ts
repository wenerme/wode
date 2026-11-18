/**
 * In-memory WebDAV server as a fetch handler, for tests. Implements the subset used by
 * `@wener/client/webdav`: PROPFIND (depth 0/1), GET (+Range), PUT (If-None-Match), MKCOL,
 * DELETE, MOVE and COPY (Overwrite, Depth: 0).
 */
export interface WebDavMockServer {
	fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
	files: Map<string, Uint8Array>;
	dirs: Set<string>;
	requests: Array<{ method: string; path: string; headers: Record<string, string> }>;
}

export function createWebDavMockServer({ base = 'https://dav.example.test/dav' } = {}): WebDavMockServer {
	const baseUrl = new URL(base.endsWith('/') ? base : `${base}/`);
	const prefix = baseUrl.pathname.replace(/\/$/u, '');
	const files = new Map<string, Uint8Array>();
	const dirs = new Set<string>(['/']);
	const requests: WebDavMockServer['requests'] = [];

	const toPath = (url: string) => {
		const pathname = new URL(url).pathname;
		const rel = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
		const segments = rel.split('/').filter(Boolean).map(decodeURIComponent);
		return `/${segments.join('/')}`;
	};
	const parent = (path: string) => path.slice(0, path.lastIndexOf('/')) || '/';
	const exists = (path: string) => files.has(path) || dirs.has(path);
	const children = (path: string) => {
		const p = path === '/' ? '/' : `${path}/`;
		return [...dirs, ...files.keys()].filter((key) => key !== path && key.startsWith(p) && !key.slice(p.length).includes('/'));
	};
	const descendants = (path: string) => [...dirs, ...files.keys()].filter((key) => key === path || key.startsWith(`${path}/`));
	const href = (path: string) => `${prefix}${path.split('/').map(encodeURIComponent).join('/')}${dirs.has(path) && path !== '/' ? '/' : ''}`;
	const prop = (path: string) => {
		const dir = dirs.has(path);
		const body = dir
			? '<d:resourcetype><d:collection/></d:resourcetype>'
			: `<d:resourcetype/><d:getcontentlength>${files.get(path)!.byteLength}</d:getcontentlength><d:getlastmodified>Mon, 01 Jan 2024 00:00:00 GMT</d:getlastmodified><d:getetag>"${path.length}"</d:getetag>`;
		return `<d:response><d:href>${href(path)}</d:href><d:propstat><d:prop>${body}</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`;
	};
	const remove = (path: string) => {
		for (const key of descendants(path)) {
			files.delete(key);
			dirs.delete(key);
		}
	};
	const copyTree = (from: string, to: string, shallow: boolean) => {
		if (files.has(from)) {
			files.set(to, files.get(from)!.slice());
			return;
		}
		dirs.add(to);
		if (shallow) return;
		for (const key of descendants(from)) {
			if (key === from) continue;
			const target = to + key.slice(from.length);
			if (dirs.has(key)) dirs.add(target);
			else files.set(target, files.get(key)!.slice());
		}
	};

	async function handle(url: string, init: RequestInit = {}): Promise<Response> {
		init.signal?.throwIfAborted();
		const method = init.method ?? 'GET';
		const headers = Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]));
		const path = toPath(url);
		requests.push({ method, path, headers });
		switch (method) {
			case 'PROPFIND': {
				if (!exists(path)) return new Response(null, { status: 404 });
				const list = headers.depth === '0' || files.has(path) ? [path] : [path, ...children(path)];
				return new Response(`<?xml version="1.0"?><d:multistatus xmlns:d="DAV:">${list.map(prop).join('')}</d:multistatus>`, { status: 207 });
			}
			case 'GET': {
				const data = files.get(path);
				if (!data) return new Response(null, { status: 404 });
				const range = /^bytes=(\d+)-(\d*)$/u.exec(headers.range ?? '');
				if (range) {
					const start = Number(range[1]);
					if (start >= data.byteLength) return new Response(null, { status: 416 });
					const end = range[2] ? Number(range[2]) + 1 : data.byteLength;
					return new Response(data.slice(start, end) as BodyInit, { status: 206 });
				}
				return new Response(data.slice() as BodyInit, { status: 200, headers: { 'content-length': String(data.byteLength) } });
			}
			case 'PUT': {
				if (dirs.has(path)) return new Response(null, { status: 405 });
				if (!dirs.has(parent(path))) return new Response(null, { status: 409 });
				if (headers['if-none-match'] === '*' && files.has(path)) return new Response(null, { status: 412 });
				const created = !files.has(path);
				files.set(path, new Uint8Array(await new Response(init.body).arrayBuffer()));
				return new Response(null, { status: created ? 201 : 204, headers: { etag: '"new"' } });
			}
			case 'MKCOL': {
				if (exists(path)) return new Response(null, { status: 405 });
				if (!dirs.has(parent(path))) return new Response(null, { status: 409 });
				dirs.add(path);
				return new Response(null, { status: 201 });
			}
			case 'DELETE': {
				if (!exists(path)) return new Response(null, { status: 404 });
				remove(path);
				return new Response(null, { status: 204 });
			}
			case 'MOVE':
			case 'COPY': {
				if (!exists(path)) return new Response(null, { status: 404 });
				const to = toPath(headers.destination!);
				if (!dirs.has(parent(to))) return new Response(null, { status: 409 });
				const existed = exists(to);
				if (existed && headers.overwrite === 'F') return new Response(null, { status: 412 });
				if (existed) remove(to);
				copyTree(path, to, method === 'COPY' && headers.depth === '0');
				if (method === 'MOVE') remove(path);
				return new Response(null, { status: existed ? 204 : 201 });
			}
			default:
				return new Response(null, { status: 405 });
		}
	}

	return {
		fetch: (input, init) => handle(input instanceof Request ? input.url : String(input), init),
		files,
		dirs,
		requests,
	};
}
