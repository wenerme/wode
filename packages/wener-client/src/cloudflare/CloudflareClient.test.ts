import { describe, expect, it, vi } from 'vitest';
import { CloudflareClient, CloudflareClientError } from './CloudflareClient';

const TOKEN = 'fixture-cf-token';

function client(response: () => Response) {
	const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => response());
	return { fetch, cf: new CloudflareClient({ apiToken: TOKEN, fetch }) };
}

describe('CloudflareClient', () => {
	it('sends Bearer token and query, returns result_info', async () => {
		const { fetch, cf } = client(() => Response.json({ success: true, result: [{ id: 'z1', name: 'example.com' }], result_info: { page: 1, total_pages: 2 } }));
		await expect(cf.listZone({ name: 'example.com', page: 1, perPage: 50 })).resolves.toEqual({
			result: [{ id: 'z1', name: 'example.com' }],
			resultInfo: { page: 1, total_pages: 2 },
		});
		const [url, init] = fetch.mock.calls[0]!;
		expect(String(url)).toBe('https://api.cloudflare.com/client/v4/zones?name=example.com&page=1&per_page=50');
		expect(new Headers(init?.headers).get('authorization')).toBe(`Bearer ${TOKEN}`);
	});

	it('builds the batch request in Cloudflare order', () => {
		const { cf } = client(() => Response.json({}));
		expect(cf.prepareBatchDnsRecord({ zoneId: 'z1', deletes: [{ id: 'a' }], patches: [{ id: 'b', ttl: 60 }], posts: [{ name: 'www.example.com', type: 'A', content: '192.0.2.1' }] })).toEqual({
			method: 'POST',
			path: '/zones/z1/dns_records/batch',
			body: { deletes: [{ id: 'a' }], patches: [{ id: 'b', ttl: 60 }], posts: [{ name: 'www.example.com', type: 'A', content: '192.0.2.1' }] },
		});
		expect(() => cf.prepareDeleteZone({ zoneId: '../x' })).toThrow(CloudflareClientError);
	});

	it('maps API errors without echoing the token', async () => {
		const { cf } = client(() => Response.json({ success: false, errors: [{ code: 10000, message: 'Authentication error' }] }, { status: 403 }));
		const error = (await cf.getZone({ zoneId: 'z1' }).catch((e: unknown) => e)) as CloudflareClientError;
		expect(error).toMatchObject({ code: 'AUTH_FAILED', status: 403, errors: [{ code: 10000, message: 'Authentication error' }] });
		expect(JSON.stringify({ ...error, message: error.message, stack: error.stack })).not.toContain(TOKEN);
		expect(() => new CloudflareClient({ apiToken: 'bad token' })).toThrow('Invalid Cloudflare configuration');
	});

	it('does not send the token to a path outside the configured API origin', async () => {
		const { fetch, cf } = client(() => Response.json({ success: true, result: {} }));
		await expect(cf.request('fixture', { method: 'GET', path: '//attacker.example/zones' })).rejects.toMatchObject({
			code: 'INVALID_REQUEST',
		});
		expect(fetch).not.toHaveBeenCalled();
	});

	it('aborts in-flight requests on close and refuses later ones', async () => {
		const fetch = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
		const cf = new CloudflareClient({ apiToken: TOKEN, fetch });
		const pending = cf.getZone({ zoneId: 'z1' });
		await cf.close();
		await expect(pending).rejects.toMatchObject({ code: 'CLOSED' });
		await expect(cf.getZone({ zoneId: 'z1' })).rejects.toMatchObject({ code: 'CLOSED' });
	});

	it('timeoutMs 0 leaves the deadline to the caller signal', async () => {
		vi.useFakeTimers();
		try {
			const fetch = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
			const cf = new CloudflareClient({ apiToken: TOKEN, fetch, timeoutMs: 0 });
			const controller = new AbortController();
			const pending = cf.getZone({ zoneId: 'z1' }, { signal: controller.signal });
			expect(vi.getTimerCount()).toBe(0);
			controller.abort();
			await expect(pending).rejects.toMatchObject({ code: 'ABORTED' });
		} finally {
			vi.useRealTimers();
		}
	});
});
