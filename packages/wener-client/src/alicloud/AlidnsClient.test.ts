import { describe, expect, it, vi } from 'vitest';
import { AlidnsClient, AlidnsClientError } from './AlidnsClient';

const ID = 'fixture-ak-id';
const SECRET = 'fixture-ak-secret';

describe('AlidnsClient', () => {
	it('signs RPC actions with a sorted RFC 3986 query', async () => {
		const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
			Response.json({ RequestId: 'r1', TotalCount: 1, PageNumber: 1, PageSize: 20, DomainRecords: { Record: [{ RecordId: '1', RR: '@', Type: 'TXT', Value: 'a b', TTL: 600 }] } }),
		);
		const client = new AlidnsClient({ accessKeyId: ID, accessKeySecret: SECRET, fetch });
		await expect(client.describeDomainRecords({ domainName: 'example.com', rrKeyWord: "it's", pageSize: 500 })).resolves.toMatchObject({
			totalCount: 1,
			items: [{ RecordId: '1', Value: 'a b' }],
		});
		const [url, init] = fetch.mock.calls[0]!;
		expect(String(url)).toBe('https://alidns.aliyuncs.com/?DomainName=example.com&PageSize=500&RRKeyWord=it%27s');
		const headers = init?.headers as Record<string, string>;
		expect(headers['x-acs-action']).toBe('DescribeDomainRecords');
		expect(headers['x-acs-version']).toBe('2015-01-09');
		expect(headers.authorization).toMatch(/^ACS3-HMAC-SHA256 Credential=fixture-ak-id,SignedHeaders=host;x-acs-action;x-acs-content-sha256;x-acs-date;x-acs-signature-nonce;x-acs-version,Signature=[0-9a-f]{64}$/u);
		expect(JSON.stringify(init)).not.toContain(SECRET);
	});

	it('reports API errors by code without credentials or response text', async () => {
		const fetch = vi.fn(async () => Response.json({ RequestId: 'r2', Code: 'InvalidAccessKeyId.NotFound', Message: `Specified access key ${ID} is not found` }, { status: 404 }));
		const client = new AlidnsClient({ accessKeyId: ID, accessKeySecret: SECRET, fetch });
		const error = (await client.deleteDomainRecord({ recordId: '1' }).catch((e: unknown) => e)) as AlidnsClientError;
		expect(error).toBeInstanceOf(AlidnsClientError);
		expect(error).toMatchObject({ code: 'AUTH_FAILED', apiCode: 'InvalidAccessKeyId.NotFound', requestId: 'r2' });
		const text = JSON.stringify({ ...error, message: error.message });
		expect(text).not.toContain(SECRET);
		expect(text).not.toContain(ID);
	});

	it('prepares write requests without sending', () => {
		const client = new AlidnsClient({ accessKeyId: ID, accessKeySecret: SECRET, fetch: vi.fn() });
		expect(client.prepareAddDomainRecord({ domainName: 'example.com', RR: '@', Type: 'mx', Value: 'mx.example.com', Priority: 10, TTL: 600 })).toEqual({
			action: 'AddDomainRecord',
			params: { DomainName: 'example.com', RR: '@', Type: 'MX', Value: 'mx.example.com', TTL: 600, Priority: 10, Line: undefined },
		});
		expect(() => new AlidnsClient({ accessKeyId: ID, accessKeySecret: 'with space' })).toThrow('Invalid Alidns configuration');
	});

	it('timeoutMs 0 leaves the deadline to the caller signal', async () => {
		const fetch = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
		const client = new AlidnsClient({ accessKeyId: ID, accessKeySecret: SECRET, fetch, timeoutMs: 0 });
		const controller = new AbortController();
		const pending = client.describeDomains({}, { signal: controller.signal });
		await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
		vi.useFakeTimers();
		try {
			expect(vi.getTimerCount()).toBe(0);
		} finally {
			vi.useRealTimers();
		}
		controller.abort();
		await expect(pending).rejects.toMatchObject({ code: 'ABORTED' });
	});
});
