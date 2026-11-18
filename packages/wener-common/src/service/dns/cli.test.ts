import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import { DnsCliDefinition } from './cli';
import type { IDnsService } from './IDnsService';

const operation = (name: string, group: string) => DnsCliDefinition.commands.find((entry) => entry.name === name && entry.group === group)!;
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({ args, options, readText: vi.fn(async (value: string) => value) });

describe('DNS CLI preparation', () => {
	it('exposes zone and record groups and marks writes as mutating with dry-run', () => {
		expect(DnsCliDefinition.name).toBe('dns');
		const writes = DnsCliDefinition.commands.filter((entry) => entry.mutating).map((entry) => `${entry.group} ${entry.name}`);
		expect(writes).toEqual(['zone create', 'zone delete', 'record set', 'record delete']);
		for (const entry of DnsCliDefinition.commands.filter((item) => item.mutating)) {
			expect(entry.supportsDryRun).toBe(true);
			expect(entry.options?.map((option) => option.name)).toEqual(expect.arrayContaining(['yes', 'dry-run']));
		}
	});

	it.each([
		['create', 'zone', ['example.com']],
		['delete', 'zone', ['example.com']],
		['set', 'record', ['example.com', 'www', 'A', '192.0.2.1']],
		['delete', 'record', ['example.com', 'www', 'A']],
	])('refuses %s %s without --yes before any client call', async (name, group, args) => {
		const ctx = context(args);
		await expect(operation(name, group).prepare(ctx)).rejects.toThrow('requires --yes');
		expect(ctx.readText).not.toHaveBeenCalled();
	});

	it('runs record set as a dry run without --yes', async () => {
		const client = { setRecord: vi.fn(async () => ({ ok: true })) } as unknown as IDnsService;
		const run = await operation('set', 'record').prepare(context(['example.com', '@', 'txt', '"v=spf1 -all"'], { 'dry-run': true, ttl: '60' }));
		await run(client, {});
		expect(client.setRecord).toHaveBeenCalledWith({ zone: 'example.com', name: '@', type: 'TXT', ttl: 60, values: ['"v=spf1 -all"'], dryRun: true }, {});
	});

	it('runs record delete and zone create with --yes', async () => {
		const client = { deleteRecord: vi.fn(async () => ({ ok: true })), createZone: vi.fn(async () => ({ ok: true })) } as unknown as IDnsService;
		await (await operation('delete', 'record').prepare(context(['example.com', 'www', 'a'], { yes: true })))(client, {});
		expect(client.deleteRecord).toHaveBeenCalledWith({ zone: 'example.com', name: 'www', type: 'A' }, {});
		await (await operation('create', 'zone').prepare(context(['example.com'], { yes: true, nameserver: ['ns1.example.com', 'ns2.example.com'] })))(client, {});
		expect(client.createZone).toHaveBeenCalledWith({ zone: 'example.com', nameservers: ['ns1.example.com', 'ns2.example.com'] }, {});
	});

	it('lists records with filters', async () => {
		const client = { listRecord: vi.fn(async () => []) } as unknown as IDnsService;
		await (await operation('list', 'record').prepare(context(['example.com'], { name: 'www', type: 'aaaa' })))(client, {});
		expect(client.listRecord).toHaveBeenCalledWith({ zone: 'example.com', name: 'www', type: 'AAAA' }, {});
	});

	it('validates arguments', async () => {
		await expect(operation('get', 'zone').prepare(context(['..']))).rejects.toThrow(ServiceCliInputError);
		await expect(operation('set', 'record').prepare(context(['example.com', 'www', 'A'], { yes: true }))).rejects.toThrow('value is required');
		await expect(operation('set', 'record').prepare(context(['example.com', 'www', 'A', '192.0.2.1'], { yes: true, ttl: '-1' }))).rejects.toThrow('--ttl');
		await expect(operation('delete', 'record').prepare(context(['example.com', '../x', 'A'], { yes: true }))).rejects.toThrow(ServiceCliInputError);
	});
});
