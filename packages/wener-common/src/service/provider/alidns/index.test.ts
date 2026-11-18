import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../../config';
import { DnsServiceCapability } from '../../dns';
import { ServiceRegistry } from '../../registry';
import { createServiceProviderAdapter } from '../../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../../runtime/ServiceProviderRegistry';
import { alidnsOwner, alidnsRecordInput, alidnsRecordValue, alidnsRR, AlidnsServiceProvider } from './index';

const ID = 'fixture-ak-id';
const SECRET = 'fixture-ak-secret';
type Rec = Record<string, unknown>;

function server(initial: Rec[] = [], fail?: (action: string) => boolean | 'hang' | 'network') {
	const records = initial.map((record) => ({ ...record }));
	const domains: Rec[] = [];
	const actions: { action: string; params: Record<string, string> }[] = [];
	let seq = 0;
	const fetch = vi.fn<FetchLike>(async (input, init) => {
		const url = new URL(String(input));
		const action = new Headers(init?.headers).get('x-acs-action') ?? '';
		const params = Object.fromEntries(url.searchParams);
		const ok = (body: Rec) => Response.json({ RequestId: `req-${actions.length}`, ...body });
		const mode = fail?.(action);
		if (mode === 'hang') return new Promise<Response>(() => undefined);
		if (mode === 'network') throw new TypeError('fetch failed');
		if (mode) return Response.json({ RequestId: 'req-fail', Code: 'DomainRecordDuplicate', Message: 'duplicate' }, { status: 400 });
		if (action !== 'DescribeDomains' && action !== 'DescribeDomainRecords') actions.push({ action, params });
		switch (action) {
			case 'DescribeDomains': {
				const all = [{ DomainId: 'd1', DomainName: 'example.com', RecordCount: 3 }, { DomainId: 'd2', DomainName: 'example.net' }, { DomainId: 'd3', DomainName: 'example.org' }, ...domains].filter(
					(domain) => !params.KeyWord || domain.DomainName === params.KeyWord,
				);
				const page = Number(params.PageNumber ?? 1);
				const size = Number(params.PageSize ?? 20);
				return ok({ TotalCount: all.length, PageNumber: page, PageSize: size, Domains: { Domain: all.slice((page - 1) * size, page * size) } });
			}
			case 'DescribeDomainRecords': {
				const all = records.filter((record) => (!params.RRKeyWord || String(record.RR).includes(params.RRKeyWord)) && (!params.Type || record.Type === params.Type));
				const page = Number(params.PageNumber ?? 1);
				const size = Number(params.PageSize ?? 20);
				return ok({ TotalCount: all.length, PageNumber: page, PageSize: size, DomainRecords: { Record: all.slice((page - 1) * size, page * size) } });
			}
			case 'AddDomainRecord': {
				const id = `n${++seq}`;
				records.push({ RecordId: id, RR: params.RR, Type: params.Type, Value: params.Value, TTL: Number(params.TTL), ...(params.Priority ? { Priority: Number(params.Priority) } : {}), Line: 'default', Status: 'ENABLE' });
				return ok({ RecordId: id });
			}
			case 'UpdateDomainRecord': {
				const record = records.find((item) => item.RecordId === params.RecordId)!;
				Object.assign(record, { RR: params.RR, Type: params.Type, Value: params.Value, TTL: Number(params.TTL), ...(params.Priority ? { Priority: Number(params.Priority) } : {}) });
				return ok({ RecordId: params.RecordId });
			}
			case 'DeleteDomainRecord':
				records.splice(records.findIndex((item) => item.RecordId === params.RecordId), 1);
				return ok({ RecordId: params.RecordId });
			case 'AddDomain':
				return ok({ DomainId: 'd9', DomainName: params.DomainName });
			case 'DeleteDomain':
				return ok({ DomainName: params.DomainName });
		}
		return Response.json({ RequestId: 'x', Code: 'InvalidAction' }, { status: 400 });
	});
	return { fetch, records, actions, domains };
}

function setup(readOnly: boolean, initial: Rec[] = [], fail?: (action: string) => boolean | 'hang' | 'network', extra: Rec = {}) {
	const s = server(initial, fail);
	const getEnv = vi.fn((name: string) => ({ ALI_ID: ID, ALI_SECRET: SECRET })[name]);
	const services = normalizeCliServices([{ name: 'dns', type: 'aliyun-dns', readOnly, options: { accessKeyIdEnv: 'ALI_ID', accessKeySecretEnv: 'ALI_SECRET', ...extra } }]);
	const rt = createServiceRuntime({
		context: { services },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(AlidnsServiceProvider)]),
		fetch: s.fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	const call = (toolName: string, input: unknown) => rt.call({ params: { service: 'dns' }, body: { toolName, input } });
	return { ...s, rt, call, getEnv };
}

const rec = (id: string, RR: string, Type: string, Value: string, extra: Rec = {}) => ({ RecordId: id, RR, Type, Value, TTL: 600, Line: 'default', Status: 'ENABLE', ...extra });

describe('Alidns provider', () => {
	it('registers as alidns/aliyun-dns without discovery side effects', async () => {
		expect(AlidnsServiceProvider).toMatchObject({ name: 'alidns', aliases: ['aliyun-dns'] });
		expect(AlidnsServiceProvider.provides.map(String)).toEqual(['dns']);
		const test = setup(true);
		await test.rt.getSchema({ params: { service: 'dns' } });
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.rt.close();
	});

	it('maps RR names relative to the domain', () => {
		expect(alidnsRR('example.com.', 'example.com')).toBe('@');
		expect(alidnsRR('a.b.example.com.', 'example.com.')).toBe('a.b');
		expect(() => alidnsRR('www.example.net.', 'example.com')).toThrow('outside');
		expect(alidnsOwner('@', 'example.com')).toBe('example.com.');
		expect(alidnsOwner('www', 'example.com')).toBe('www.example.com.');
	});

	it.each([
		['TXT', '"v=spf1 -all"', { Value: 'v=spf1 -all' }, '"v=spf1 -all"'],
		['TXT', '"part one" "part two"', { Value: 'part onepart two' }, '"part onepart two"'],
		['TXT', '"say \\"hi\\""', { Value: 'say "hi"' }, '"say \\"hi\\""'],
		['MX', '10 mx.example.com.', { Value: 'mx.example.com', Priority: 10 }, '10 mx.example.com.'],
		['SRV', '10 5 5060 sip.example.com.', { Value: '10 5 5060 sip.example.com' }, '10 5 5060 sip.example.com.'],
		['CAA', '0 issue "ca.example.net"', { Value: '0 issue "ca.example.net"' }, '0 issue "ca.example.net"'],
		['CNAME', 'target.example.net.', { Value: 'target.example.net' }, 'target.example.net.'],
	])('converts %s %s', (type, value, native, back) => {
		expect(alidnsRecordInput(type, value)).toEqual(native);
		expect(alidnsRecordValue({ Type: type, ...native })).toBe(back);
	});

	it('groups records; disabled and other-line records go to metadata', async () => {
		const test = setup(true, [
			rec('1', 'www', 'A', '192.0.2.1'),
			rec('2', 'www', 'A', '192.0.2.2'),
			rec('3', 'www', 'A', '192.0.2.3', { Status: 'DISABLE' }),
			rec('4', 'www', 'A', '192.0.2.4', { Line: 'telecom' }),
			rec('5', '@', 'MX', 'mx.example.com', { Priority: 10 }),
		]);
		const result = (await test.call('listRecord', { zone: 'example.com' })) as { rrsets: Rec[] };
		expect(result.rrsets).toEqual([
			{
				name: 'www.example.com.', type: 'A', ttl: 600, values: ['192.0.2.1', '192.0.2.2'],
				metadata: {
					records: [{ id: '1', value: '192.0.2.1' }, { id: '2', value: '192.0.2.2' }],
					disabledValues: ['192.0.2.3'],
					lineRecords: [{ id: '4', line: 'telecom', value: '192.0.2.4', ttl: 600 }],
				},
			},
			{ name: 'example.com.', type: 'MX', ttl: 600, values: ['10 mx.example.com.'], metadata: { records: [{ id: '5', value: '10 mx.example.com.' }] } },
		]);
		await test.rt.close();
	});

	it('plans setRecord with updates, creates and deletes; dryRun sends no writes', async () => {
		const test = setup(true, [rec('1', 'www', 'A', '192.0.2.1'), rec('2', 'www', 'A', '192.0.2.2'), rec('3', 'www', 'A', '192.0.2.3', { Status: 'DISABLE' }), rec('9', 'www2', 'A', '192.0.2.8')]);
		const result = await test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 600, values: ['192.0.2.1', '192.0.2.7', '192.0.2.8'], dryRun: true });
		expect(result).toMatchObject({
			ok: true, dryRun: true,
			rrset: { name: 'www.example.com.', type: 'A', ttl: 600, values: ['192.0.2.1', '192.0.2.7', '192.0.2.8'] },
			request: {
				atomic: false,
				requests: [
					{ action: 'DeleteDomainRecord', params: { RecordId: '3' } },
					{ action: 'UpdateDomainRecord', params: { RecordId: '2', RR: 'www', Type: 'A', Value: '192.0.2.7', TTL: 600, Line: 'default' } },
					{ action: 'AddDomainRecord', params: { DomainName: 'example.com', RR: 'www', Type: 'A', Value: '192.0.2.8', TTL: 600 } },
				],
			},
		});
		expect(test.actions).toEqual([]);
		await test.rt.close();
	});

	it('applies setRecord and round-trips list -> set without changes', async () => {
		const test = setup(false, [rec('1', '@', 'MX', 'old.example.com', { Priority: 20 })]);
		await test.call('setRecord', { zone: 'example.com', name: '@', type: 'MX', ttl: 600, values: ['10 mx1.example.com.', '20 mx2.example.com.'] });
		expect(test.actions.map((item) => item.action)).toEqual(['UpdateDomainRecord', 'AddDomainRecord']);
		expect(test.actions[0]!.params).toMatchObject({ RecordId: '1', RR: '@', Value: 'mx1.example.com', Priority: '10' });
		const { rrsets } = (await test.call('listRecord', { zone: 'example.com', name: '@', type: 'MX' })) as { rrsets: { values: string[] }[] };
		expect(rrsets[0]!.values).toEqual(['10 mx1.example.com.', '20 mx2.example.com.']);
		await test.call('setRecord', { zone: 'example.com', name: '@', type: 'MX', ttl: 600, values: rrsets[0]!.values });
		expect(test.actions).toHaveLength(2);
		await test.rt.close();
	});

	it('reports partially applied changes', async () => {
		const test = setup(false, [rec('1', 'www', 'A', '192.0.2.1')], (action) => action === 'AddDomainRecord');
		const error = (await test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 600, values: ['192.0.2.5', '192.0.2.6'] }).catch((e: unknown) => e)) as Error;
		expect(error).toMatchObject({ name: 'AlidnsPartialChangeError', applied: [{ action: 'UpdateDomainRecord' }], unknown: [], pending: [{ action: 'AddDomainRecord' }] });
		expect(error.message).toContain('1 applied, 0 unknown, 1 not applied of 2');
		await test.rt.close();
	});

	it('reports a transport failure as unknown, since the server may have applied it', async () => {
		const test = setup(false, [rec('1', 'www', 'A', '192.0.2.1')], (action) => (action === 'AddDomainRecord' ? 'network' : false));
		const error = (await test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 600, values: ['192.0.2.5', '192.0.2.6'] }).catch((e: unknown) => e)) as Error;
		expect(error).toMatchObject({ name: 'AlidnsPartialChangeError', applied: [{ action: 'UpdateDomainRecord' }], unknown: [{ action: 'AddDomainRecord' }], pending: [] });
		await test.rt.close();
	});

	it('deletes all records of an RRSet', async () => {
		const test = setup(false, [rec('1', 'www', 'A', '192.0.2.1'), rec('2', 'www', 'A', '192.0.2.2', { Status: 'DISABLE' }), rec('3', 'www', 'TXT', 'x')]);
		await expect(test.call('deleteRecord', { zone: 'example.com', name: 'www', type: 'A', dryRun: true })).resolves.toMatchObject({ dryRun: true, request: { requests: [{ params: { RecordId: '1' } }, { params: { RecordId: '2' } }] } });
		expect(test.actions).toEqual([]);
		await test.call('deleteRecord', { zone: 'example.com', name: 'www', type: 'A' });
		expect(test.records.map((item) => item.RecordId)).toEqual(['3']);
		await test.rt.close();
	});

	it.each([
		['setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 600, values: ['192.0.2.1'] }],
		['deleteRecord', { zone: 'example.com', name: 'www', type: 'A' }],
		['createZone', { zone: 'example.net' }],
		['deleteZone', { zone: 'example.com' }],
	])('refuses %s on a read-only service before any HTTP', async (toolName, input) => {
		const test = setup(true);
		await expect(test.call(toolName, input)).rejects.toThrow('read-only');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.rt.close();
	});

	it('previews zone writes without credentials or HTTP', async () => {
		const test = setup(true);
		await expect(test.call('createZone', { zone: 'example.net', dryRun: true })).resolves.toMatchObject({ dryRun: true, request: { action: 'AddDomain', params: { DomainName: 'example.net' } } });
		await expect(test.call('deleteZone', { zone: 'example.com.', dryRun: true })).resolves.toMatchObject({ dryRun: true, request: { action: 'DeleteDomain', params: { DomainName: 'example.com' } } });
		expect(test.fetch).not.toHaveBeenCalled();
		expect(test.getEnv).not.toHaveBeenCalled();
		await test.rt.close();
	});

	it('paginates domains with server pages', async () => {
		const test = setup(true);
		const first = (await test.call('listZone', { limit: 2 })) as { zones: Rec[]; nextCursor?: string };
		expect(first.zones.map((zone) => zone.name)).toEqual(['example.com.', 'example.net.']);
		expect(first.zones[0]).toEqual({ id: 'd1', name: 'example.com.', metadata: { RecordCount: 3 } });
		const second = (await test.call('listZone', { limit: 2, cursor: first.nextCursor })) as { zones: Rec[]; nextCursor?: string };
		expect(second).toEqual({ zones: [{ id: 'd3', name: 'example.org.' }] });
		await expect(test.call('getZone', { zone: 'example.net' })).resolves.toEqual({ id: 'd2', name: 'example.net.' });
		await test.rt.close();
	});

	it('never exposes credentials in errors and closes', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({ RequestId: 'r', Code: 'SignatureDoesNotMatch', Message: `bad signature for ${ID}` }, { status: 400 }));
		const registry = new ServiceRegistry({
			context: { services: normalizeCliServices([{ name: 'dns', type: 'alidns', options: { accessKeyId: ID, accessKeySecret: SECRET } }]) },
			fetch,
		});
		registry.register(AlidnsServiceProvider);
		const dns = await registry.load(DnsServiceCapability, 'dns');
		const error = (await dns.listZone().catch((e: unknown) => e)) as Error;
		expect(error).toMatchObject({ code: 'AUTH_FAILED' });
		const text = `${error.message} ${error.stack} ${JSON.stringify(error)}`;
		expect(text).not.toContain(SECRET);
		expect(text).not.toContain(ID);
		await registry.close();
		await expect(dns.listZone()).rejects.toMatchObject({ code: 'CLOSED' });
	});

	it('reports applied, unknown and pending requests when the deadline stops a change', async () => {
		const test = setup(false, [rec('1', 'www', 'A', '192.0.2.1'), rec('2', 'www', 'A', '192.0.2.2')], (action) => (action === 'DeleteDomainRecord' ? 'hang' : false), { timeoutMs: 200 });
		const error = (await test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 600, values: ['192.0.2.9'] }).catch((e: unknown) => e)) as Error & Rec;
		expect(error).toMatchObject({
			name: 'AlidnsPartialChangeError',
			applied: [{ action: 'UpdateDomainRecord', params: { RecordId: '1', Value: '192.0.2.9' } }],
			unknown: [{ action: 'DeleteDomainRecord', params: { RecordId: '2' } }],
			pending: [],
			cause: { code: 'TIMEOUT' },
		});
		expect(error.message).toContain('1 applied, 1 unknown, 0 not applied of 2');
		await test.rt.close();
	});

	it('splits over-long TXT into 255-byte strings and treats the round-trip as a no-op', async () => {
		const long = 'a'.repeat(300);
		const test = setup(false);
		await test.call('setRecord', { zone: 'example.com', name: '@', type: 'TXT', ttl: 600, values: [`"${long}"`] });
		expect(test.actions).toEqual([{ action: 'AddDomainRecord', params: expect.objectContaining({ Value: long }) }]);
		const { rrsets } = (await test.call('listRecord', { zone: 'example.com', name: '@', type: 'TXT' })) as { rrsets: { values: string[] }[] };
		expect(rrsets[0]!.values).toEqual([`"${'a'.repeat(255)}" "${'a'.repeat(45)}"`]);
		await test.call('setRecord', { zone: 'example.com', name: '@', type: 'TXT', ttl: 600, values: rrsets[0]!.values });
		await test.call('setRecord', { zone: 'example.com', name: '@', type: 'TXT', ttl: 600, values: [`"${long}"`] });
		expect(test.actions).toHaveLength(1);
		await test.rt.close();
	});

	it('scopes writes to the default line and deletes disabled default-line records first', async () => {
		const test = setup(false, [
			rec('1', 'www', 'A', '192.0.2.1', { Status: 'Disable' }),
			rec('2', 'www', 'A', '192.0.2.2'),
			rec('3', 'www', 'A', '192.0.2.3', { Line: 'telecom' }),
			rec('4', 'www', 'A', '192.0.2.4', { Line: 'unicom', Status: 'Disable' }),
		]);
		await test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 600, values: ['192.0.2.1', '192.0.2.2'] });
		expect(test.actions.map(({ action, params }) => [action, params.RecordId ?? params.Value])).toEqual([
			['DeleteDomainRecord', '1'],
			['AddDomainRecord', '192.0.2.1'],
		]);
		const { rrsets } = (await test.call('listRecord', { zone: 'example.com', name: 'www', type: 'A' })) as { rrsets: { values: string[]; metadata: Rec }[] };
		expect(rrsets[0]!.values).toEqual(['192.0.2.2', '192.0.2.1']);
		expect(rrsets[0]!.metadata.lineRecords).toEqual([
			{ id: '3', line: 'telecom', value: '192.0.2.3', ttl: 600 },
			{ id: '4', line: 'unicom', value: '192.0.2.4', ttl: 600, disabled: true },
		]);
		await test.call('deleteRecord', { zone: 'example.com', name: 'www', type: 'A' });
		expect(test.records.map((item) => item.RecordId).sort()).toEqual(['3', '4']);
		await test.rt.close();
	});

	it('keeps listing when one record cannot be parsed', async () => {
		const test = setup(true, [rec('1', '_sip._tcp', 'SRV', 'not an srv'), rec('2', '_sip._tcp', 'SRV', '10 5 5060 sip.example.com')]);
		const { rrsets } = (await test.call('listRecord', { zone: 'example.com' })) as { rrsets: { values: string[]; metadata: Rec }[] };
		expect(rrsets[0]!.values).toEqual(['not an srv', '10 5 5060 sip.example.com.']);
		expect(rrsets[0]!.metadata).toMatchObject({ unparsedValues: ['not an srv'], records: [{ id: '1', unparsed: true }, { id: '2' }] });
		await test.rt.close();
	});

	it('finds IDN domains by punycode', async () => {
		const test = setup(true);
		// Alidns keys IDN domains by the Unicode name and reports the ASCII form in PunyCode.
		test.domains.push({ DomainId: 'd8', DomainName: '\u4f8b\u5b50.example', PunyCode: 'xn--fsqu00a.example' });
		await expect(test.call('getZone', { zone: 'xn--fsqu00a.example.' })).resolves.toMatchObject({ id: 'd8' });
		await expect(test.call('getZone', { zone: '\u4f8b\u5b50.example' })).resolves.toMatchObject({ id: 'd8' });
		await expect(test.call('getZone', { zone: 'xn--zz.example' })).rejects.toThrow('not found');
		await test.rt.close();
	});

	it('rejects a cursor reused with a different limit', async () => {
		const test = setup(true);
		const first = (await test.call('listZone', { limit: 2 })) as { nextCursor?: string };
		expect(first.nextCursor).toBe('p:2:2');
		await expect(test.call('listZone', { limit: 1, cursor: first.nextCursor })).rejects.toThrow('different limit');
		await test.rt.close();
	});
});
