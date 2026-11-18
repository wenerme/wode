import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../../config';
import { DnsServiceCapability } from '../../dns';
import { ServiceRegistry } from '../../registry';
import { createServiceProviderAdapter } from '../../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../../runtime/ServiceProviderRegistry';
import { cloudflareRecordInput, cloudflareRecordValue, CloudflareDnsServiceProvider, groupCloudflareRecords } from './index';

const TOKEN = 'fixture-cf-token';
const ZONE = { id: 'zone1', name: 'example.com', type: 'full', status: 'active' };
type Rec = Record<string, unknown>;

function server(initial: Rec[] = []) {
	const records = initial.map((record) => ({ ...record }));
	const batches: Rec[] = [];
	const fetch = vi.fn<FetchLike>(async (input, init) => {
		const url = new URL(String(input));
		const method = init?.method ?? 'GET';
		const ok = (result: unknown, info?: Rec) => Response.json({ success: true, errors: [], result, ...(info ? { result_info: info } : {}) });
		if (url.pathname.endsWith('/zones') && method === 'GET') {
			const name = url.searchParams.get('name');
			const all = [ZONE, { id: 'zone2', name: 'example.net' }, { id: 'zone3', name: 'example.org' }].filter((zone) => !name || zone.name === name);
			const page = Number(url.searchParams.get('page') ?? 1);
			const size = Number(url.searchParams.get('per_page') ?? 50);
			return ok(all.slice((page - 1) * size, page * size), { page, per_page: size, total_pages: Math.ceil(all.length / size) });
		}
		if (url.pathname.endsWith('/zones/zone1') && method === 'GET') return ok(ZONE);
		if (url.pathname.endsWith('/dns_records') && method === 'GET') {
			const name = url.searchParams.get('name');
			const type = url.searchParams.get('type');
			const all = records.filter((record) => (!name || record.name === name) && (!type || record.type === type));
			const page = Number(url.searchParams.get('page') ?? 1);
			const size = Number(url.searchParams.get('per_page') ?? 100);
			return ok(all.slice((page - 1) * size, page * size), { page, total_pages: Math.max(1, Math.ceil(all.length / size)) });
		}
		if (url.pathname.endsWith('/dns_records/batch') && method === 'POST') {
			const body = JSON.parse(String(init?.body)) as { deletes?: Rec[]; patches?: Rec[]; posts?: Rec[] };
			batches.push(body);
			for (const del of body.deletes ?? []) records.splice(records.findIndex((record) => record.id === del.id), 1);
			for (const patch of body.patches ?? []) Object.assign(records.find((record) => record.id === patch.id)!, patch);
			for (const [index, post] of (body.posts ?? []).entries()) records.push({ id: `new${batches.length}-${index}`, ...post });
			return ok({});
		}
		return Response.json({ success: false, errors: [{ code: 7003, message: 'Not found' }] }, { status: 404 });
	});
	return { fetch, records, batches };
}

function setup(readOnly: boolean, initial: Rec[] = [], options: Rec = { apiTokenEnv: 'CF_FIXTURE_TOKEN' }) {
	const s = server(initial);
	const getEnv = vi.fn((name: string) => (name === 'CF_FIXTURE_TOKEN' ? TOKEN : undefined));
	const services = normalizeCliServices([{ name: 'dns', type: 'cf', readOnly, options }]);
	const rt = createServiceRuntime({
		context: { services },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(CloudflareDnsServiceProvider)]),
		fetch: s.fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	const call = (toolName: string, input: unknown) => rt.call({ params: { service: 'dns' }, body: { toolName, input } });
	return { ...s, rt, call, getEnv };
}

const A1 = { id: 'a1', name: 'www.example.com', type: 'A', content: '192.0.2.1', ttl: 60, proxied: true };
const A2 = { id: 'a2', name: 'www.example.com', type: 'A', content: '192.0.2.2', ttl: 60, proxied: true };
const A3 = { id: 'a3', name: 'www.example.com', type: 'A', content: '192.0.2.3', ttl: 60, proxied: true };
const TXT = { id: 't1', name: 'example.com', type: 'TXT', content: '"v=spf1 -all"', ttl: 1 };

describe('Cloudflare DNS provider', () => {
	it('registers as cloudflare/cf without discovery side effects', async () => {
		expect(CloudflareDnsServiceProvider).toMatchObject({ name: 'cloudflare', aliases: ['cf'] });
		expect(CloudflareDnsServiceProvider.provides.map(String)).toEqual(['dns']);
		const test = setup(true);
		const schema = await test.rt.getSchema({ params: { service: 'dns' } });
		expect(Object.keys(schema.tools)).toEqual(expect.arrayContaining(['listZone', 'setRecord', 'deleteRecord']));
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.rt.close();
	});

	it('groups records into RRSets with proxied and auto TTL in metadata', async () => {
		const test = setup(true, [A1, A2, TXT, { id: 'm1', name: 'example.com', type: 'MX', content: 'mx.example.com', priority: 10, ttl: 300 }]);
		const result = (await test.call('listRecord', { zone: 'example.com' })) as { rrsets: Rec[] };
		expect(result.rrsets).toEqual([
			{ name: 'www.example.com.', type: 'A', ttl: 60, values: ['192.0.2.1', '192.0.2.2'], metadata: { proxied: true, records: [{ id: 'a1', value: '192.0.2.1', proxied: true }, { id: 'a2', value: '192.0.2.2', proxied: true }] } },
			{ name: 'example.com.', type: 'TXT', ttl: 1, values: ['"v=spf1 -all"'], metadata: { autoTtl: true, records: [{ id: 't1', value: '"v=spf1 -all"' }] } },
			{ name: 'example.com.', type: 'MX', ttl: 300, values: ['10 mx.example.com.'], metadata: { records: [{ id: 'm1', value: '10 mx.example.com.' }] } },
		]);
		const [url, init] = test.fetch.mock.calls[0]!;
		expect(String(url)).toContain('/zones?name=example.com');
		expect(new Headers(init?.headers).get('authorization')).toBe(`Bearer ${TOKEN}`);
		await test.rt.close();
	});

	it.each([
		['TXT', '"part one" "part two"', { content: '"part one" "part two"' }],
		['TXT', '"say \\"hi\\""', { content: '"say \\"hi\\""' }],
		['MX', '10 mx.example.com.', { content: 'mx.example.com', priority: 10 }],
		['SRV', '10 5 5060 sip.example.com.', { data: { priority: 10, weight: 5, port: 5060, target: 'sip.example.com' } }],
		['CAA', '0 issue "ca.example.net"', { data: { flags: 0, tag: 'issue', value: 'ca.example.net' } }],
		['CNAME', 'target.example.net.', { content: 'target.example.net' }],
	])('round-trips %s %s', (type, value, body) => {
		const input = cloudflareRecordInput(type, value);
		expect(input).toEqual(body);
		expect(cloudflareRecordValue({ id: 'x', name: 'example.com', type, ttl: 60, ...input })).toBe(value);
	});

	it('reads legacy unquoted TXT and content-only SRV/CAA', () => {
		expect(cloudflareRecordValue({ id: 'x', name: 'a', type: 'TXT', ttl: 1, content: 'raw "text"' })).toBe('"raw \\"text\\""');
		expect(cloudflareRecordValue({ id: 'x', name: 'a', type: 'SRV', ttl: 1, content: '5 443 host.example.com', priority: 1 })).toBe('1 5 443 host.example.com.');
		expect(cloudflareRecordValue({ id: 'x', name: 'a', type: 'CAA', ttl: 1, content: '0 issue "ca.example.net"' })).toBe('0 issue "ca.example.net"');
		expect(groupCloudflareRecords([])).toEqual([]);
	});

	it('plans setRecord as one batch and previews it with dryRun on a read-only service', async () => {
		const test = setup(true, [A1, A2, A3]);
		const input = { zone: 'example.com', name: 'www', type: 'a', ttl: 60, values: ['192.0.2.1', '192.0.2.9'] };
		const result = await test.call('setRecord', { ...input, dryRun: true });
		expect(result).toMatchObject({
			ok: true,
			dryRun: true,
			rrset: { name: 'www.example.com.', type: 'A', ttl: 60, values: ['192.0.2.1', '192.0.2.9'] },
			request: {
				method: 'POST',
				path: '/zones/zone1/dns_records/batch',
				body: { deletes: [{ id: 'a3' }], patches: [{ id: 'a2', name: 'www.example.com', type: 'A', ttl: 1, content: '192.0.2.9' }] },
				summary: { unchanged: 1, update: 1, create: 0, delete: 1 },
			},
		});
		expect(test.batches).toEqual([]);
		expect(test.fetch.mock.calls.every(([, init]) => (init?.method ?? 'GET') === 'GET')).toBe(true);
		await test.rt.close();
	});

	it('applies setRecord and inherits proxied for new records', async () => {
		const test = setup(false, [A1]);
		await test.call('setRecord', { zone: 'example.com', name: 'www.example.com.', type: 'A', ttl: 60, values: ['192.0.2.1', '192.0.2.5'] });
		expect(test.batches).toEqual([{ posts: [{ name: 'www.example.com', type: 'A', ttl: 1, content: '192.0.2.5', proxied: true }] }]);
		const listed = (await test.call('listRecord', { zone: 'example.com', name: 'www', type: 'A' })) as { rrsets: { values: string[] }[] };
		expect(listed.rrsets[0]!.values).toEqual(['192.0.2.1', '192.0.2.5']);
		// Unchanged RRSet sends no batch.
		await test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 60, values: ['192.0.2.5', '192.0.2.1'] });
		expect(test.batches).toHaveLength(1);
		await test.rt.close();
	});

	it('round-trips TXT multi-string through list -> set without changes', async () => {
		const test = setup(false);
		await test.call('setRecord', { zone: 'example.com', name: '@', type: 'TXT', ttl: 300, values: ['"part one" "part two"', '"k=v\\059x"'] });
		expect(test.batches[0]).toEqual({ posts: [
			{ name: 'example.com', type: 'TXT', ttl: 300, content: '"part one" "part two"' },
			{ name: 'example.com', type: 'TXT', ttl: 300, content: '"k=v\\059x"' },
		] });
		const { rrsets } = (await test.call('listRecord', { zone: 'example.com', name: '@', type: 'TXT' })) as { rrsets: { values: string[]; ttl: number }[] };
		expect(rrsets[0]!.values).toEqual(['"part one" "part two"', '"k=v\\059x"']);
		await test.call('setRecord', { zone: 'example.com', name: '@', type: 'TXT', ttl: 300, values: rrsets[0]!.values });
		expect(test.batches).toHaveLength(1);
		await test.rt.close();
	});

	it('deletes an RRSet with one batch', async () => {
		const test = setup(false, [A1, A2, TXT]);
		await expect(test.call('deleteRecord', { zone: 'example.com', name: 'www', type: 'A', dryRun: true })).resolves.toMatchObject({ dryRun: true, request: { body: { deletes: [{ id: 'a1' }, { id: 'a2' }] } } });
		expect(test.batches).toEqual([]);
		await test.call('deleteRecord', { zone: 'example.com', name: 'www', type: 'A' });
		expect(test.batches).toEqual([{ deletes: [{ id: 'a1' }, { id: 'a2' }] }]);
		expect(test.records.map((record) => record.id)).toEqual(['t1']);
		await test.rt.close();
	});

	it.each([
		['setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 60, values: ['192.0.2.1'] }],
		['deleteRecord', { zone: 'example.com', name: 'www', type: 'A' }],
		['createZone', { zone: 'example.net' }],
		['deleteZone', { zone: 'example.com' }],
	])('refuses %s on a read-only service before any HTTP', async (toolName, input) => {
		const test = setup(true, [], { apiToken: TOKEN, accountId: 'acc1' });
		await expect(test.call(toolName, input)).rejects.toThrow('read-only');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.rt.close();
	});

	it('previews createZone without credentials or HTTP', async () => {
		const test = setup(true, [], { apiTokenEnv: 'CF_FIXTURE_TOKEN', accountId: 'acc1' });
		await expect(test.call('createZone', { zone: 'example.net', dryRun: true })).resolves.toMatchObject({
			ok: true, dryRun: true, zone: { name: 'example.net.' }, request: { method: 'POST', path: '/zones', body: { name: 'example.net', account: { id: 'acc1' } } },
		});
		expect(test.fetch).not.toHaveBeenCalled();
		expect(test.getEnv).not.toHaveBeenCalled();
		await test.rt.close();
	});

	it('paginates zones with server pages', async () => {
		const test = setup(true);
		const first = (await test.call('listZone', { limit: 2 })) as { zones: Rec[]; nextCursor?: string };
		expect(first.zones.map((zone) => zone.name)).toEqual(['example.com.', 'example.net.']);
		expect(first.nextCursor).toBe('p:2:2');
		await expect(test.call('listZone', { limit: 1, cursor: first.nextCursor })).rejects.toThrow('different limit');
		const second = (await test.call('listZone', { limit: 2, cursor: first.nextCursor })) as { zones: Rec[]; nextCursor?: string };
		expect(second).toEqual({ zones: [{ id: 'zone3', name: 'example.org.' }] });
		expect(((await test.call('listZone', {})) as { zones: unknown[] }).zones).toHaveLength(3);
		await expect(test.call('listZone', { cursor: 'bogus' })).rejects.toThrow();
		await test.rt.close();
	});

	it('pages records locally after grouping', async () => {
		const test = setup(true, [A1, TXT, { ...A1, id: 'c', name: 'c.example.com' }]);
		const first = (await test.call('listRecord', { zone: 'example.com', limit: 2 })) as { rrsets: Rec[]; nextCursor?: string };
		expect(first.rrsets).toHaveLength(2);
		const second = (await test.call('listRecord', { zone: 'example.com', limit: 2, cursor: first.nextCursor })) as { rrsets: Rec[]; nextCursor?: string };
		expect(second.rrsets.map((rrset) => rrset.name)).toEqual(['c.example.com.']);
		expect(second.nextCursor).toBeUndefined();
		await test.rt.close();
	});

	it('never exposes the token in errors and reads it lazily', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({ success: false, errors: [{ code: 10000, message: 'Authentication error' }] }, { status: 403 }));
		const getEnv = vi.fn(() => TOKEN);
		const registry = new ServiceRegistry({ context: { services: normalizeCliServices([{ name: 'dns', type: 'cloudflare', options: { apiTokenEnv: 'CF_FIXTURE_TOKEN' } }]) }, fetch, getEnv });
		registry.register(CloudflareDnsServiceProvider);
		const dns = await registry.load(DnsServiceCapability, 'dns');
		expect(getEnv).not.toHaveBeenCalled();
		const error = (await dns.listZone().catch((e: unknown) => e)) as Error;
		expect(error).toMatchObject({ code: 'AUTH_FAILED' });
		expect(`${error.message} ${error.stack} ${JSON.stringify(error)}`).not.toContain(TOKEN);
		await registry.close();
		await expect(dns.listZone()).rejects.toMatchObject({ code: 'CLOSED' });
	});

	it('rejects conflicting or missing credentials', async () => {
		for (const options of [{ apiToken: TOKEN, apiTokenEnv: 'X' }, {}]) {
			const registry = new ServiceRegistry({ context: { services: normalizeCliServices([{ name: 'dns', type: 'cloudflare', options }]) } });
			registry.register(CloudflareDnsServiceProvider);
			const error = (await registry.load(DnsServiceCapability, 'dns').catch((e: unknown) => e)) as Error;
			expect(error).toBeInstanceOf(Error);
			expect(String(error.message)).not.toContain(TOKEN);
			await registry.close();
		}
	});

	it('splits over-long TXT strings on write and legacy read; the round-trip is a no-op', async () => {
		const long = 'a'.repeat(300);
		const split = `"${'a'.repeat(255)}" "${'a'.repeat(45)}"`;
		expect(cloudflareRecordValue({ id: 'x', name: 'a', type: 'TXT', ttl: 1, content: long })).toBe(split);
		const test = setup(false);
		await test.call('setRecord', { zone: 'example.com', name: '@', type: 'TXT', ttl: 300, values: [`"${long}"`] });
		expect(test.batches).toEqual([{ posts: [{ name: 'example.com', type: 'TXT', ttl: 300, content: split }] }]);
		const { rrsets } = (await test.call('listRecord', { zone: 'example.com', type: 'TXT' })) as { rrsets: { values: string[] }[] };
		expect(rrsets[0]!.values).toEqual([split]);
		await test.call('setRecord', { zone: 'example.com', name: '@', type: 'TXT', ttl: 300, values: [`"${long}"`] });
		await test.call('setRecord', { zone: 'example.com', name: '@', type: 'TXT', ttl: 300, values: rrsets[0]!.values });
		expect(test.batches).toHaveLength(1);
		await test.rt.close();
	});

	it('legacy unquoted over-long TXT is a no-op against the split form', async () => {
		const test = setup(false, [{ id: 't9', name: 'example.com', type: 'TXT', content: 'b'.repeat(300), ttl: 300 }]);
		await test.call('setRecord', { zone: 'example.com', name: '@', type: 'TXT', ttl: 300, values: [`"${'b'.repeat(300)}"`] });
		expect(test.batches).toEqual([]);
		await test.rt.close();
	});

	it('refuses a change above maxBatchChanges without sending a partial batch', async () => {
		const records = Array.from({ length: 3 }, (_, index) => ({ ...A1, id: `r${index}`, content: `192.0.2.${10 + index}` }));
		const test = setup(false, records, { apiToken: TOKEN, maxBatchChanges: 2 });
		await expect(test.call('deleteRecord', { zone: 'example.com', name: 'www', type: 'A' })).rejects.toThrow('above the batch limit of 2');
		await expect(test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 60, values: ['192.0.2.1', '192.0.2.2', '192.0.2.3', '192.0.2.4'] })).rejects.toThrow('batch limit');
		await expect(test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 60, values: ['192.0.2.1'], dryRun: true })).rejects.toThrow('batch limit');
		expect(test.batches).toEqual([]);
		await expect(test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 60, values: ['192.0.2.10', '192.0.2.11'] })).resolves.toMatchObject({ ok: true });
		expect(test.batches).toEqual([{ deletes: [{ id: 'r2' }] }]);
		await test.rt.close();
	});

	it('ignores TTL of proxied records so a proxied RRSet is stable', async () => {
		const test = setup(false, [{ ...A1, ttl: 1 }, { ...A2, ttl: 1 }]);
		await test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 300, values: ['192.0.2.1', '192.0.2.2'] });
		expect(test.batches).toEqual([]);
		// A value change on a proxied record keeps TTL 1 instead of sending the requested TTL.
		await test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 300, values: ['192.0.2.1', '192.0.2.7'] });
		expect(test.batches).toEqual([{ patches: [{ id: 'a2', name: 'www.example.com', type: 'A', ttl: 1, content: '192.0.2.7' }] }]);
		await test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 300, values: ['192.0.2.1', '192.0.2.7'] });
		expect(test.batches).toHaveLength(1);
		await test.rt.close();
	});

	it('keeps listing when one SRV/CAA record cannot be parsed', async () => {
		const test = setup(true, [
			{ id: 's1', name: '_sip._tcp.example.com', type: 'SRV', content: 'garbage', ttl: 60 },
			{ id: 's2', name: '_sip._tcp.example.com', type: 'SRV', data: { priority: 1, weight: 2, port: 5060, target: 'sip.example.com' }, ttl: 60 },
			{ id: 'c1', name: 'example.com', type: 'CAA', content: '0 bad tag! x', ttl: 60 },
		]);
		const { rrsets } = (await test.call('listRecord', { zone: 'example.com' })) as { rrsets: { values: string[]; metadata: Rec }[] };
		expect(rrsets[0]).toMatchObject({ values: ['garbage', '1 2 5060 sip.example.com.'], metadata: { unparsedValues: ['garbage'], records: [{ id: 's1', unparsed: true }, { id: 's2' }] } });
		expect(rrsets[1]).toMatchObject({ values: ['0 bad tag! x'], metadata: { unparsedValues: ['0 bad tag! x'] } });
		await test.rt.close();
	});

	it('the service deadline (timeoutMs) owns the timeout of a whole operation', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>((_url, init) => new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
		const registry = new ServiceRegistry({ context: { services: normalizeCliServices([{ name: 'dns', type: 'cloudflare', options: { apiToken: TOKEN, timeoutMs: 50 } }]) }, fetch });
		registry.register(CloudflareDnsServiceProvider);
		const dns = await registry.load(DnsServiceCapability, 'dns');
		await expect(dns.listZone()).rejects.toMatchObject({ code: 'TIMEOUT', message: 'DNS operation timed out' });
		expect(fetch.mock.calls[0]![1]!.signal!.aborted).toBe(true);
		await expect(dns.listZone(undefined, { context: { timeoutMs: 20 } })).rejects.toMatchObject({ code: 'TIMEOUT' });
		await registry.close();
	});
});
