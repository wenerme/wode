import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import {
	isPowerDnsWriteRequest,
	isSafePowerDnsPath,
	normalizePowerDnsRecordName,
	PowerDnsClient,
	PowerDnsClientError,
	powerDnsZoneId,
} from './index';

const API_KEY = 'fixture-api-key';

function setup(response: () => Response = () => Response.json([])) {
	const fetch = vi.fn<FetchLike>(async () => response());
	const client = new PowerDnsClient({ baseUrl: 'https://dns.example.com/', apiKey: API_KEY, fetch });
	const call = (index = 0) => {
		const [url, init] = fetch.mock.calls[index]!;
		return { url: String(url), init: init!, headers: new Headers(init!.headers) };
	};
	return { fetch, client, call };
}

describe('PowerDnsClient', () => {
	it('sends X-API-Key against /api/v1 and the default server', async () => {
		const { client, call } = setup();
		await client.listZone({ dnssec: true });
		expect(call().url).toBe('https://dns.example.com/api/v1/servers/localhost/zones?dnssec=true');
		expect(call().headers.get('x-api-key')).toBe(API_KEY);
		expect(call().init.method).toBe('GET');
	});

	it('does not duplicate an /api/v1 base path', async () => {
		const fetch = vi.fn<FetchLike>(async () => Response.json([]));
		await new PowerDnsClient({ baseUrl: 'https://dns.example.com/api/v1', apiKey: API_KEY, fetch }).listServer();
		expect(String(fetch.mock.calls[0]![0])).toBe('https://dns.example.com/api/v1/servers');
	});

	it('normalizes zone and record names into a REPLACE patch', async () => {
		const { client, call } = setup(() => new Response(null, { status: 204 }));
		await client.replaceRrset({ zone: 'example.com', name: 'www', type: 'a', ttl: 60, records: [{ content: '192.0.2.1' }] });
		expect(call().url).toBe('https://dns.example.com/api/v1/servers/localhost/zones/example.com.');
		expect(call().init.method).toBe('PATCH');
		expect(JSON.parse(String(call().init.body))).toEqual({
			rrsets: [{ name: 'www.example.com.', type: 'A', changetype: 'REPLACE', ttl: 60, records: [{ content: '192.0.2.1', disabled: false }] }],
		});
		expect(call().headers.get('content-type')).toBe('application/json');
	});

	it('resolves apex, relative and absolute record names', () => {
		expect(normalizePowerDnsRecordName('@', 'example.com')).toBe('example.com.');
		expect(normalizePowerDnsRecordName('mail', 'example.com.')).toBe('mail.example.com.');
		expect(normalizePowerDnsRecordName('mail.example.com', 'example.com')).toBe('mail.example.com.');
		expect(normalizePowerDnsRecordName('other.example.net.', 'example.com')).toBe('other.example.net.');
	});

	it('restricts raw API paths', () => {
		for (const path of ['/servers', '/servers/localhost/zones?rrsets=false', '/servers/localhost/zones/example.com.'])
			expect(isSafePowerDnsPath(path)).toBe(true);
		for (const path of ['servers', '//evil.example', '/servers/../x', '/servers/%2e%2e/x', '/a#b', '/a\\b', '/a%2fb', '/a\nb'])
			expect(isSafePowerDnsPath(path)).toBe(false);
		expect(isPowerDnsWriteRequest({ method: 'GET' })).toBe(false);
		expect(isPowerDnsWriteRequest({ body: {} })).toBe(true);
		expect(isPowerDnsWriteRequest({ method: 'DELETE' })).toBe(true);
	});

	it('rejects unsafe raw requests before fetch', async () => {
		const { client, fetch } = setup();
		await expect(client.request({ path: '/../admin' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(client.request({ path: '/servers', method: 'TRACE' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(client.request({ path: '/servers', method: 'GET', body: {} })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(fetch).not.toHaveBeenCalled();
	});

	it('accepts an /api/v1 prefixed raw path and forwards query values', async () => {
		const { client, call } = setup();
		await client.request({ path: '/api/v1/servers/localhost/zones', query: { rrsets: false } });
		expect(call().url).toBe('https://dns.example.com/api/v1/servers/localhost/zones?rrsets=false');
	});

	it('maps HTTP failures to fixed errors without echoing the key or response body', async () => {
		const { client } = setup(() => new Response(`bad key ${API_KEY}`, { status: 401 }));
		const error = await client.getZone({ zone: 'example.com' }).catch((value: unknown) => value);
		expect(error).toBeInstanceOf(PowerDnsClientError);
		expect(error).toMatchObject({ code: 'AUTH_FAILED', status: 401 });
		expect(JSON.stringify(error) + String((error as Error).message)).not.toContain(API_KEY);
	});

	it('wraps transport errors without leaking their message', async () => {
		const fetch = vi.fn<FetchLike>(async () => {
			throw new Error(`connect failed with ${API_KEY}`);
		});
		const client = new PowerDnsClient({ baseUrl: 'https://dns.example.com', apiKey: API_KEY, fetch });
		const error = (await client.listServer().catch((value: unknown) => value)) as Error;
		expect(error).toMatchObject({ code: 'REQUEST_FAILED' });
		expect(error.message).not.toContain(API_KEY);
	});

	it('rejects invalid configuration without echoing values', () => {
		expect(() => new PowerDnsClient({ baseUrl: 'https://user:secret@dns.example.com', apiKey: API_KEY })).toThrow('Invalid PowerDNS configuration');
		expect(() => new PowerDnsClient({ baseUrl: 'https://dns.example.com', apiKey: 'bad key' })).toThrow(PowerDnsClientError);
		expect(() => new PowerDnsClient({ baseUrl: 'https://dns.example.com', apiKey: API_KEY, headers: { 'X-API-Key': 'x' } })).toThrow(PowerDnsClientError);
	});

	it('honors abort signals and timeouts', async () => {
		const fetch = vi.fn<FetchLike>((_url, init) => new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
		const client = new PowerDnsClient({ baseUrl: 'https://dns.example.com', apiKey: API_KEY, fetch });
		const controller = new AbortController();
		const pending = client.listServer({ signal: controller.signal });
		controller.abort();
		await expect(pending).rejects.toMatchObject({ code: 'ABORTED' });
		await expect(client.listServer({ timeoutMs: 5 })).rejects.toMatchObject({ code: 'TIMEOUT' });
		const closing = client.listServer();
		await client.close();
		await expect(closing).rejects.toMatchObject({ code: 'CLOSED' });
		await expect(client.listServer()).rejects.toMatchObject({ code: 'CLOSED' });
	});

	it('bounds response size and validates response shape', async () => {
		const fetch = vi.fn<FetchLike>(async () => Response.json({ big: 'x'.repeat(100) }));
		const client = new PowerDnsClient({ baseUrl: 'https://dns.example.com', apiKey: API_KEY, fetch, maxResponseBytes: 20 });
		await expect(client.getServer()).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
		const { client: other } = setup(() => Response.json({ not: 'a list' }));
		await expect(other.listZone()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
	});

	it('builds metadata, cryptokey and TSIG requests', async () => {
		const { client, call } = setup(() => Response.json({}));
		await client.setMetadata({ zone: 'example.com', kind: 'ALLOW-AXFR-FROM', values: ['192.0.2.0/24'] });
		expect(call(0).url).toBe('https://dns.example.com/api/v1/servers/localhost/zones/example.com./metadata/ALLOW-AXFR-FROM');
		expect(JSON.parse(String(call(0).init.body))).toEqual({ kind: 'ALLOW-AXFR-FROM', metadata: ['192.0.2.0/24'] });
		await client.updateCryptokey({ zone: 'example.com', id: 3, active: false });
		expect(call(1)).toMatchObject({ url: 'https://dns.example.com/api/v1/servers/localhost/zones/example.com./cryptokeys/3' });
		await client.createTsigKey({ server: 'other', name: 'transfer' });
		expect(call(2).url).toBe('https://dns.example.com/api/v1/servers/other/tsigkeys');
		expect(JSON.parse(String(call(2).init.body))).toEqual({ name: 'transfer', algorithm: 'hmac-sha256' });
	});

	it('rejects dot and empty path segments before fetch', async () => {
		const { client, fetch } = setup();
		await expect(client.deleteMetadata({ zone: 'example.com', kind: '..' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(client.getMetadata({ zone: 'example.com', kind: '.' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(client.deleteZone({ zone: '..' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(client.getServer({ server: '..' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(client.listZone({ server: '.' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(client.deleteTsigKey({ id: '..' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(client.getTsigKey({ id: 'a/b' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(() => client.prepareDeleteRrset({ zone: '..', name: 'www', type: 'A' })).toThrow(PowerDnsClientError);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('encodes zone ids like PowerDNS, including the root zone as =2E', async () => {
		expect(powerDnsZoneId('.')).toBe('=2E');
		expect(powerDnsZoneId('example.com')).toBe('example.com.');
		expect(powerDnsZoneId('0/25.2.0.192.in-addr.arpa')).toBe('0=2F25.2.0.192.in-addr.arpa.');
		const { client, call } = setup(() => Response.json({}));
		await client.getZone({ zone: '.' });
		expect(call().url).toBe('https://dns.example.com/api/v1/servers/localhost/zones/%3D2E');
		await client.deleteZone({ zone: '0/25.2.0.192.in-addr.arpa' });
		expect(call(1).url).toBe('https://dns.example.com/api/v1/servers/localhost/zones/0%3D2F25.2.0.192.in-addr.arpa.');
	});
});
