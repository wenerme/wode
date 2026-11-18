import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import { PowerDnsCliDefinition } from './cli';
import type { IPowerDnsService } from './IPowerDnsService';

const operation = (name: string, group?: string) => PowerDnsCliDefinition.commands.find((entry) => entry.name === name && entry.group === group)!;
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({ args, options, readText: vi.fn(async (value: string) => value) });

describe('PowerDNS CLI preparation', () => {
	it('leaves portable zone and record commands to the dns CLI', () => {
		const names = PowerDnsCliDefinition.commands.map((entry) => `${entry.group ?? ''} ${entry.name}`.trim());
		for (const name of ['zone list', 'zone get', 'zone delete', 'record list', 'record set', 'record delete']) expect(names).not.toContain(name);
	});

	it('exposes the powerdns name and pdns alias', () => {
		expect(PowerDnsCliDefinition.name).toBe('powerdns');
		expect(PowerDnsCliDefinition.aliases).toContain('pdns');
	});

	it('marks every write command as mutating with --yes', () => {
		const writes = PowerDnsCliDefinition.commands.filter((entry) => entry.mutating);
		expect(writes.map((entry) => `${entry.group} ${entry.name}`)).toEqual([
			'zone create', 'zone notify', 'zone axfr-retrieve',
			'metadata set', 'metadata delete', 'cryptokey create', 'cryptokey update', 'cryptokey delete',
			'tsigkey create', 'tsigkey update', 'tsigkey delete',
		]);
		for (const entry of writes) expect(entry.options?.some((option) => option.name === 'yes')).toBe(true);
	});

	it.each([
		['notify', 'zone', ['example.com']],
		['axfr-retrieve', 'zone', ['example.com']],
		['set', 'metadata', ['example.com', 'SOA-EDIT-API', 'DEFAULT']],
		['update', 'cryptokey', ['example.com', '1']],
		['create', 'tsigkey', ['transfer']],
	])('refuses %s %s without --yes before reading input', async (name, group, args) => {
		const ctx = context(args, { key: '@secret.txt', active: 'false' });
		await expect(operation(name, group).prepare(ctx)).rejects.toThrow('requires --yes');
		expect(ctx.readText).not.toHaveBeenCalled();
	});

	it('refuses raw API writes without --yes before reading the body', async () => {
		const ctx = context(['/servers/localhost/zones'], { body: '@zone.json' });
		await expect(operation('api').prepare(ctx)).rejects.toThrow('requires --yes');
		await expect(operation('api').prepare(context(['/servers/localhost/zones/example.com.'], { method: 'DELETE' }))).rejects.toThrow(ServiceCliInputError);
		expect(ctx.readText).not.toHaveBeenCalled();
	});

	it('allows a raw GET without --yes and parses query values', async () => {
		const client = { request: vi.fn(async () => []) } as unknown as IPowerDnsService;
		const run = await operation('api').prepare(context(['/servers/localhost/zones'], { query: ['rrsets=false'] }));
		await run(client, {});
		expect(client.request).toHaveBeenCalledWith({ path: '/servers/localhost/zones', method: 'GET', query: { rrsets: 'false' } }, {});
	});

	it('reads the raw API body only after confirmation', async () => {
		const client = { request: vi.fn(async () => ({})) } as unknown as IPowerDnsService;
		const ctx = context(['/servers/localhost/zones'], { body: '{"name":"example.com."}', yes: true });
		const run = await operation('api').prepare(ctx);
		await run(client, {});
		expect(ctx.readText).toHaveBeenCalledOnce();
		expect(client.request).toHaveBeenCalledWith({ path: '/servers/localhost/zones', method: 'POST', query: {}, body: { name: 'example.com.' } }, {});
	});

	it('validates arguments before confirmation-gated execution', async () => {
		await expect(operation('update', 'cryptokey').prepare(context(['example.com', '1'], { yes: true }))).rejects.toThrow('--active or --published');
		await expect(operation('get', 'cryptokey').prepare(context(['example.com', 'x']))).rejects.toThrow(ServiceCliInputError);
		await expect(operation('api').prepare(context(['/servers'], { method: 'TRACE' }))).rejects.toThrow('--method');
	});

	it.each([
		['list', [], 'listTsigKey', [{ id: 'transfer.', name: 'transfer', key: 'c2VjcmV0' }, { id: 'nokey.', name: 'nokey' }]],
		['get', ['transfer.'], 'getTsigKey', { id: 'transfer.', name: 'transfer', key: 'c2VjcmV0' }],
		['create', ['transfer'], 'createTsigKey', { id: 'transfer.', name: 'transfer', key: 'c2VjcmV0' }],
		['update', ['transfer.'], 'updateTsigKey', { id: 'transfer.', name: 'renamed', key: 'c2VjcmV0' }],
	] as const)('redacts TSIG secrets for tsigkey %s unless --show-secret', async (name, args, method, value) => {
		const client = { [method]: vi.fn(async () => value) } as unknown as IPowerDnsService;
		const base = { yes: true, ...(name === 'update' ? { name: 'renamed' } : {}) };
		const redacted = await (await operation(name, 'tsigkey').prepare(context([...args], base)))(client, {});
		expect(JSON.stringify(redacted)).not.toContain('c2VjcmV0');
		expect(JSON.stringify(redacted)).toContain('[redacted]');
		if (Array.isArray(redacted)) expect(redacted[1]).toEqual({ id: 'nokey.', name: 'nokey' });
		const shown = await (await operation(name, 'tsigkey').prepare(context([...args], { ...base, 'show-secret': true })))(client, {});
		expect(shown).toEqual(value);
		expect(operation(name, 'tsigkey').options?.some((option) => option.name === 'show-secret')).toBe(true);
	});

	it('creates a PowerDNS zone with specific fields and dry-run', async () => {
		const client = { createPowerDnsZone: vi.fn(async () => ({ ok: true })) } as unknown as IPowerDnsService;
		const op = operation('create', 'zone');
		expect(op.supportsDryRun).toBe(true);
		await expect(op.prepare(context(['example.com']))).rejects.toThrow('requires --yes');
		const run = await op.prepare(context(['example.com'], { 'dry-run': true, kind: 'Slave', master: ['192.0.2.53'], account: 'ops', dnssec: true }));
		await run(client, {});
		expect(client.createPowerDnsZone).toHaveBeenCalledWith({ zone: 'example.com', kind: 'Slave', masters: ['192.0.2.53'], account: 'ops', dnssec: true, dryRun: true }, {});
		await expect(op.prepare(context(['example.com'], { yes: true, kind: 'Native', master: ['192.0.2.53'] }))).rejects.toThrow('--master requires');
		await expect(op.prepare(context(['example.com'], { yes: true, kind: 'Bogus' }))).rejects.toThrow('--kind');
	});

	it('warns that raw API responses are not redacted', () => {
		expect(operation('api').description).toContain('not redacted');
	});
});
