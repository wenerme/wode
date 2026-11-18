import { describe, expect, it, vi } from 'vitest';
import { GoogleAnalyticsClient, GoogleAnalyticsClientError, GoogleOAuthTokenUrl, normalizeGoogleAnalyticsPropertyId } from './index';

async function serviceAccount() {
	const pair = await crypto.subtle.generateKey(
		{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
		true,
		['sign', 'verify'],
	);
	const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
	let binary = '';
	for (const byte of der) binary += String.fromCharCode(byte);
	const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(binary).replace(/(.{64})/gu, '$1\n')}\n-----END PRIVATE KEY-----\n`;
	return { key: { client_email: 'fixture@example.iam.gserviceaccount.com', private_key: pem }, publicKey: pair.publicKey };
}

const decode = (part: string) => JSON.parse(atob(part.replace(/-/gu, '+').replace(/_/gu, '/')));

describe('GoogleAnalyticsClient', () => {
	it('normalizes property IDs without echoing invalid values', () => {
		expect(normalizeGoogleAnalyticsPropertyId('properties/123')).toBe('123');
		expect(normalizeGoogleAnalyticsPropertyId(42)).toBe('42');
		expect(() => normalizeGoogleAnalyticsPropertyId('G-SECRET')).toThrow(expect.not.objectContaining({ message: expect.stringContaining('SECRET') }));
	});

	it('exchanges a Web Crypto signed JWT once and caches the token', async () => {
		const { key, publicKey } = await serviceAccount();
		const fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
			if (String(url) === GoogleOAuthTokenUrl) {
				const assertion = new URLSearchParams(String(init?.body)).get('assertion')!;
				const [header, payload, signature] = assertion.split('.');
				const sig = Uint8Array.from(atob(signature!.replace(/-/gu, '+').replace(/_/gu, '/')), (c) => c.charCodeAt(0));
				const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, sig, new TextEncoder().encode(`${header}.${payload}`));
				expect(ok).toBe(true);
				expect(decode(header!)).toEqual({ alg: 'RS256', typ: 'JWT' });
				expect(decode(payload!)).toMatchObject({ iss: key.client_email, aud: GoogleOAuthTokenUrl, scope: expect.stringContaining('analytics.readonly') });
				return Response.json({ access_token: 'fixture-token', expires_in: 3600 });
			}
			return Response.json({ accountSummaries: [] });
		});
		const client = new GoogleAnalyticsClient({ credentials: { serviceAccount: key }, fetch, projectId: 'fixture-project' });
		await client.listAccountSummaries();
		await client.getProperty({ propertyId: 'properties/7' });
		expect(fetch.mock.calls.filter(([url]) => String(url) === GoogleOAuthTokenUrl)).toHaveLength(1);
		const [url, init] = fetch.mock.calls[2]!;
		expect(String(url)).toBe('https://analyticsadmin.googleapis.com/v1beta/properties/7');
		const headers = new Headers(init?.headers);
		expect(headers.get('authorization')).toBe('Bearer fixture-token');
		expect(headers.get('x-goog-user-project')).toBe('fixture-project');
		await client.close();
	});

	it('maps report DTOs to the Data API REST body', async () => {
		const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => Response.json({ rows: [] }));
		const client = new GoogleAnalyticsClient({ credentials: { accessToken: 'fixture-token' }, fetch });
		await client.runReport({ propertyId: '123', dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }], dimensions: ['date'], metrics: ['activeUsers'], limit: 5 });
		const [url, init] = fetch.mock.calls[0]!;
		expect(String(url)).toBe('https://analyticsdata.googleapis.com/v1beta/properties/123:runReport');
		expect(init?.method).toBe('POST');
		expect(JSON.parse(String(init?.body))).toEqual({
			dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
			dimensions: [{ name: 'date' }],
			metrics: [{ name: 'activeUsers' }],
			limit: 5,
		});
		await client.runRealtimeReport({ propertyId: '123', dimensions: ['country'], metrics: ['activeUsers'] });
		expect(String(fetch.mock.calls[1]![0])).toContain(':runRealtimeReport');
	});

	it('applies one deadline across a hanging credential resolver and token exchange', async () => {
		const resolver = vi.fn(() => new Promise<never>(() => undefined));
		const fetch = vi.fn();
		const client = new GoogleAnalyticsClient({ credentials: resolver, fetch, timeoutMs: 20 });
		await expect(client.getMetadata({ propertyId: '1' })).rejects.toMatchObject({ code: 'TIMEOUT' });
		expect(fetch).not.toHaveBeenCalled();

		const { key } = await serviceAccount();
		const hanging = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
		const slow = new GoogleAnalyticsClient({ credentials: { serviceAccount: key }, fetch: hanging });
		await expect(slow.getMetadata({ propertyId: '1' }, { timeoutMs: 20 })).rejects.toMatchObject({ code: 'TIMEOUT' });
		expect(String(hanging.mock.calls[0]![0])).toBe(GoogleOAuthTokenUrl);
	});

	it('honors caller abort and close for in-flight requests', async () => {
		const fetch = vi.fn(() => new Promise<Response>(() => undefined));
		const client = new GoogleAnalyticsClient({ credentials: { accessToken: 't' }, fetch });
		const controller = new AbortController();
		const request = client.getProperty({ propertyId: '1' }, { signal: controller.signal });
		controller.abort();
		await expect(request).rejects.toMatchObject({ code: 'ABORTED' });
		const pending = client.getProperty({ propertyId: '1' });
		await client.close();
		await expect(pending).rejects.toMatchObject({ code: 'CLOSED' });
		await expect(client.getProperty({ propertyId: '1' })).rejects.toMatchObject({ code: 'CLOSED' });
	});

	it('returns fixed errors for HTTP failures, oversize and invalid bodies', async () => {
		const failing = new GoogleAnalyticsClient({ credentials: { accessToken: 't' }, fetch: async () => new Response('secret detail', { status: 403 }) });
		const error = await failing.getProperty({ propertyId: '1' }).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(GoogleAnalyticsClientError);
		expect(error).toMatchObject({ code: 'AUTH_FAILED', status: 403 });
		expect(String((error as Error).message)).not.toContain('secret');

		const big = new GoogleAnalyticsClient({ credentials: { accessToken: 't' }, maxResponseBytes: 8, fetch: async () => Response.json({ value: 'x'.repeat(64) }) });
		await expect(big.getProperty({ propertyId: '1' })).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
		const invalid = new GoogleAnalyticsClient({ credentials: { accessToken: 't' }, fetch: async () => new Response('[1]') });
		await expect(invalid.getProperty({ propertyId: '1' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
	});

	it('rejects non-Google token endpoints and invalid keys without leaking material', async () => {
		const fetch = vi.fn();
		const custom = new GoogleAnalyticsClient({ credentials: { serviceAccount: { client_email: 'a@example.test', private_key: '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----', token_uri: 'https://token.example.test' } }, fetch });
		await expect(custom.getProperty({ propertyId: '1' })).rejects.toMatchObject({ code: 'INVALID_CONFIG' });
		const bad = new GoogleAnalyticsClient({ credentials: { serviceAccount: { client_email: 'a@example.test', private_key: '-----BEGIN PRIVATE KEY-----\nnot-base64!\n-----END PRIVATE KEY-----' } }, fetch });
		const error = await bad.getProperty({ propertyId: '1' }).catch((e: unknown) => e);
		expect(error).toMatchObject({ code: 'INVALID_CONFIG' });
		expect(String((error as Error).message)).not.toContain('not-base64');
		expect(fetch).not.toHaveBeenCalled();
	});

	it('requires https except for loopback hosts', () => {
		const make = (dataBaseUrl: string) => new GoogleAnalyticsClient({ credentials: { accessToken: 't' }, dataBaseUrl, fetch: vi.fn() });
		for (const url of ['http://localhost:8080', 'http://127.0.0.1', 'http://[::1]:9000', 'https://analytics.example.test']) expect(() => make(url)).not.toThrow();
		for (const url of ['http://analytics.example.test', 'http://192.0.2.1', 'ftp://localhost', 'https://u:p@analytics.example.test'])
			expect(() => make(url)).toThrow(expect.objectContaining({ code: 'INVALID_CONFIG' }));
	});

	it('builds report bodies from an allow-list and rejects non-applicable fields', async () => {
		const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => Response.json({}));
		const client = new GoogleAnalyticsClient({ credentials: { accessToken: 't' }, fetch });
		const base = { propertyId: '1', dimensions: ['country'], metrics: ['activeUsers'] };
		await expect(client.runRealtimeReport({ ...base, dateRanges: [{ startDate: 'a', endDate: 'b' }] } as never)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(client.runRealtimeReport({ ...base, offset: 1 } as never)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(client.runReport({ ...base, dateRanges: [{ startDate: 'a', endDate: 'b' }], injected: true } as never)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(client.runReport({ ...base, dateRanges: [], metrics: [] })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(fetch).not.toHaveBeenCalled();
		await client.runRealtimeReport({ ...base, limit: 3 });
		expect(JSON.parse(String(fetch.mock.calls[0]![1]?.body))).toEqual({ dimensions: [{ name: 'country' }], metrics: [{ name: 'activeUsers' }], limit: 3 });
	});

	it('cuts a hanging credential resolver with the per-call deadline', async () => {
		const fetch = vi.fn();
		const client = new GoogleAnalyticsClient({ credentials: () => new Promise<never>(() => undefined), fetch });
		await expect(client.listAccountSummaries({}, { timeoutMs: 15 })).rejects.toMatchObject({ code: 'TIMEOUT' });
		expect(fetch).not.toHaveBeenCalled();
	});

	it('aborts on close during token exchange and does not cache or use the token', async () => {
		const { key } = await serviceAccount();
		let release!: (response: Response) => void;
		let tokenSignal: AbortSignal | undefined;
		const fetch = vi.fn((url: string | URL | Request, init?: RequestInit) => {
			if (String(url) !== GoogleOAuthTokenUrl) return Promise.resolve(Response.json({}));
			tokenSignal = init?.signal ?? undefined;
			return new Promise<Response>((resolve) => (release = resolve));
		});
		const client = new GoogleAnalyticsClient({ credentials: { serviceAccount: key }, fetch });
		const request = client.getProperty({ propertyId: '1' });
		await vi.waitFor(() => expect(tokenSignal).toBeDefined());
		await client.close();
		await expect(request).rejects.toMatchObject({ code: 'CLOSED' });
		expect(tokenSignal?.aborted).toBe(true);
		release(Response.json({ access_token: 'late-token', expires_in: 3600 }));
		await new Promise((resolve) => setTimeout(resolve, 5));
		await expect(client.getProperty({ propertyId: '1' })).rejects.toMatchObject({ code: 'CLOSED' });
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});
