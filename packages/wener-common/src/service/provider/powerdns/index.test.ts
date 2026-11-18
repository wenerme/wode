import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../../config';
import { DnsServiceCapability } from '../../dns';
import { PowerDnsServiceCapability } from '../../powerdns';
import { ServiceRegistry } from '../../registry';
import { createServiceProviderAdapter } from '../../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../../runtime/ServiceProviderRegistry';
import { PowerDnsServiceProvider, toDnsRRSet, toDnsZone } from './index';

const KEY = 'fixture-key';
const zoneFixture = {
	id: 'example.com.', name: 'example.com.', kind: 'Native', serial: 2024010101, dnssec: false,
	rrsets: [
		{ name: 'www.example.com.', type: 'A', ttl: 60, records: [{ content: '192.0.2.1', disabled: false }, { content: '192.0.2.2', disabled: true }], comments: [] },
		{ name: 'example.com.', type: 'NS', ttl: 3600, records: [{ content: 'ns1.example.com.', disabled: false }] },
	],
};

function setup(readOnly = true, response: () => Response = () => Response.json(zoneFixture)) {
	const getEnv = vi.fn((name: string) => (name === 'PDNS_FIXTURE_KEY' ? KEY : undefined));
	const fetch = vi.fn<FetchLike>(async () => response());
	const services = normalizeCliServices([{ name: 'dns', type: 'powerdns', readOnly, baseUrl: 'https://dns.example.com', options: { apiKeyEnv: 'PDNS_FIXTURE_KEY' } }]);
	const rt = createServiceRuntime({
		context: { services },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(PowerDnsServiceProvider)]),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	const call = (toolName: string, input: unknown) => rt.call({ params: { service: 'dns' }, body: { toolName, input } });
	return { rt, fetch, getEnv, call };
}

describe('PowerDNS provider', () => {
	it('provides both dns and powerdns capabilities with disjoint tools and no discovery side effects', async () => {
		expect(PowerDnsServiceProvider).toMatchObject({ name: 'powerdns', aliases: ['pdns'] });
		expect(PowerDnsServiceProvider.provides.map(String)).toEqual(['dns', 'powerdns']);
		const test = setup();
		const schema = await test.rt.getSchema({ params: { service: 'dns' } });
		expect(Object.keys(schema.tools)).toEqual(expect.arrayContaining(['listZone', 'setRecord', 'listTsigKey', 'request']));
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.rt.close();
	});

	it('maps listRecord to normalized RRSets with supplier fields in metadata', async () => {
		const test = setup();
		const result = await test.call('listRecord', { zone: 'example.com', name: 'WWW', type: 'a' });
		expect(result).toEqual({ rrsets: [{ name: 'www.example.com.', type: 'A', ttl: 60, values: ['192.0.2.1'], metadata: { disabledValues: ['192.0.2.2'] } }] });
		const [url, init] = test.fetch.mock.calls[0]!;
		expect(String(url)).toBe('https://dns.example.com/api/v1/servers/localhost/zones/example.com.?rrsets=true&rrset_name=WWW.example.com.&rrset_type=A');
		expect(new Headers(init?.headers).get('x-api-key')).toBe(KEY);
		await test.rt.close();
	});

	it('maps zones and keeps extra fields in metadata', async () => {
		expect(toDnsZone(zoneFixture)).toEqual({ id: 'example.com.', name: 'example.com.', kind: 'Native', serial: 2024010101, metadata: { dnssec: false } });
		expect(toDnsRRSet({ name: 'a.example.com.', type: 'TXT', ttl: 5, records: [] })).toEqual({ name: 'a.example.com.', type: 'TXT', ttl: 5, values: [] });
	});

	it('encodes the root zone as =2E', async () => {
		const test = setup(true, () => Response.json({ id: '=2E', name: '.', kind: 'Native' }));
		await expect(test.call('getZone', { zone: '.' })).resolves.toMatchObject({ id: '=2E', name: '.' });
		expect(String(test.fetch.mock.calls[0]![0])).toBe('https://dns.example.com/api/v1/servers/localhost/zones/%3D2E?rrsets=false');
		await test.rt.close();
	});

	it.each([
		['setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 60, values: ['192.0.2.1'] }],
		['deleteRecord', { zone: 'example.com', name: 'www', type: 'A' }],
		['createZone', { zone: 'example.net' }],
		['deleteZone', { zone: 'example.com' }],
		['setMetadata', { zone: 'example.com', kind: 'SOA-EDIT-API', values: ['DEFAULT'] }],
	])('refuses %s on a read-only service before HTTP', async (toolName, input) => {
		const test = setup();
		await expect(test.call(toolName, input)).rejects.toThrow('read-only');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.rt.close();
	});

	it('previews dns writes with dryRun on a read-only service without HTTP', async () => {
		const test = setup();
		await expect(test.call('setRecord', { zone: 'example.com', name: '@', type: 'txt', ttl: 60, values: ['"hello"'], dryRun: true })).resolves.toMatchObject({
			ok: true, dryRun: true,
			rrset: { name: 'example.com.', type: 'TXT', ttl: 60, values: ['"hello"'] },
			request: { method: 'PATCH', path: '/servers/localhost/zones/example.com.' },
		});
		await expect(test.call('deleteZone', { zone: '.', dryRun: true })).resolves.toMatchObject({ request: { method: 'DELETE', path: '/servers/localhost/zones/%3D2E' } });
		await expect(test.call('createZone', { zone: 'example.net', dryRun: true })).resolves.toMatchObject({ zone: { name: 'example.net.' }, request: { method: 'POST' } });
		expect(test.fetch).not.toHaveBeenCalled();
		await test.rt.close();
	});

	it('performs dns writes when writable', async () => {
		const test = setup(false, () => new Response(null, { status: 204 }));
		await expect(test.call('setRecord', { zone: 'example.com', name: 'www', type: 'A', ttl: 60, values: ['192.0.2.1'] })).resolves.toMatchObject({ ok: true, rrset: { name: 'www.example.com.' } });
		expect(JSON.parse(String(test.fetch.mock.calls[0]![1]!.body))).toMatchObject({ rrsets: [{ changetype: 'REPLACE', records: [{ content: '192.0.2.1' }] }] });
		await test.rt.close();
	});

	it('shares one client between capabilities of the same configured service', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json([]));
		const services = normalizeCliServices([{ name: 'dns', type: 'powerdns', baseUrl: 'https://dns.example.com', options: { apiKey: KEY } }]);
		const registry = new ServiceRegistry({ context: { services }, fetch });
		registry.register(PowerDnsServiceProvider);
		const dns = await registry.load(DnsServiceCapability, 'dns');
		const ext = await registry.load(PowerDnsServiceCapability, 'dns');
		expect(dns).toMatchObject({ type: 'dns', provider: 'powerdns', readOnly: true });
		expect(ext).toMatchObject({ type: 'powerdns', readOnly: true });
		await dns.listZone();
		await ext.listTsigKey();
		await expect(dns.listZone(undefined, { context: { timeoutMs: 5 } })).resolves.toEqual({ zones: [] });
		await registry.close();
		await expect(ext.listServer()).rejects.toMatchObject({ code: 'CLOSED' });
	});

	it.each([
		['TXT', ['"v=spf1 -all"', '"part one" "part two"', '"say \\"hi\\" \\\\ ok"', '"k=v;" "p=MIIB\\059x"']],
		['MX', ['10 mx1.example.com.', '20 mx2.example.com.']],
	])('round-trips %s presentation-format values without mangling', async (type, values) => {
		let stored: unknown;
		const fetch = vi.fn<FetchLike>(async (_url, init) => {
			if (init?.method === 'PATCH') {
				stored = (JSON.parse(String(init.body)) as { rrsets: unknown[] }).rrsets[0];
				return new Response(null, { status: 204 });
			}
			return Response.json({ id: 'example.com.', name: 'example.com.', rrsets: stored ? [stored] : [] });
		});
		const services = normalizeCliServices([{ name: 'dns', type: 'powerdns', readOnly: false, baseUrl: 'https://dns.example.com', options: { apiKey: KEY } }]);
		const registry = new ServiceRegistry({ context: { services }, fetch: fetch as unknown as typeof globalThis.fetch });
		registry.register(PowerDnsServiceProvider);
		const dns = await registry.load(DnsServiceCapability, 'dns');
		await dns.setRecord({ zone: 'example.com', name: '@', type, ttl: 300, values });
		expect((stored as { records: { content: string }[] }).records.map((record) => record.content)).toEqual(values);
		const { rrsets } = await dns.listRecord({ zone: 'example.com', name: '@', type });
		expect(rrsets[0]?.values).toEqual(values);
		await registry.close();
	});

	it('list -> set keeps enabled values and drops disabled ones (documented)', async () => {
		const test = setup(false);
		const { rrsets } = (await test.call('listRecord', { zone: 'example.com', name: 'www', type: 'A' })) as { rrsets: { name: string; type: string; ttl: number; values: string[] }[] };
		const [rrset] = rrsets;
		test.fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
		await test.call('setRecord', { zone: 'example.com', name: rrset!.name, type: rrset!.type, ttl: rrset!.ttl, values: rrset!.values });
		const body = JSON.parse(String(test.fetch.mock.calls[1]![1]!.body)) as { rrsets: { records: unknown[] }[] };
		expect(body.rrsets[0]!.records).toEqual([{ content: '192.0.2.1', disabled: false }]);
		await test.rt.close();
	});

	it('paginates locally only when limit is given', async () => {
		const zones = ['a', 'b', 'c'].map((label) => ({ id: `${label}.example.com.`, name: `${label}.example.com.` }));
		const test = setup(true, () => Response.json(zones));
		expect(await test.call('listZone', {})).toEqual({ zones: zones.map((zone) => ({ ...zone })) });
		const first = (await test.call('listZone', { limit: 2 })) as { zones: unknown[]; nextCursor?: string };
		expect(first.zones).toHaveLength(2);
		expect(first.nextCursor).toBeTruthy();
		const second = (await test.call('listZone', { limit: 2, cursor: first.nextCursor })) as { zones: unknown[]; nextCursor?: string };
		expect(second).toEqual({ zones: [{ id: 'c.example.com.', name: 'c.example.com.' }] });
		await expect(test.call('listZone', { cursor: 'bogus' })).rejects.toThrow();
		await test.rt.close();
	});

	it('creates PowerDNS-specific zones through the extension with dry-run and write gating', async () => {
		const test = setup(true);
		const input = { zone: 'example.org', kind: 'Slave', masters: ['192.0.2.53'], account: 'ops', dnssec: false };
		await expect(test.call('createPowerDnsZone', input)).rejects.toThrow('read-only');
		await expect(test.call('createPowerDnsZone', { ...input, dryRun: true })).resolves.toMatchObject({
			ok: true, dryRun: true,
			request: { method: 'POST', path: '/servers/localhost/zones', body: { name: 'example.org.', kind: 'Slave', masters: ['192.0.2.53'], account: 'ops', dnssec: false } },
		});
		expect(test.fetch).not.toHaveBeenCalled();
		await test.rt.close();
		const writable = setup(false, () => Response.json({ id: 'example.org.', name: 'example.org.', kind: 'Slave' }, { status: 201 }));
		await expect(writable.call('createPowerDnsZone', input)).resolves.toMatchObject({ id: 'example.org.', kind: 'Slave' });
		expect(writable.fetch.mock.calls[0]![1]!.method).toBe('POST');
		await writable.rt.close();
	});
});
