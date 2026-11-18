import type { CliTable } from '../../../cli/render/CliTable';
import {
	type ServiceCliDefinition,
	type ServiceCliInputContext,
	type ServiceCliOperation,
	type ServiceCliOption,
	serviceCliString,
} from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { IDnsService } from '../IDnsService';
import { isValidDnsName } from '../name';

type Operation = ServiceCliOperation<IDnsService>;
type Run = Awaited<ReturnType<Operation['prepare']>>;

const yesOption: ServiceCliOption = { name: 'yes', description: 'Confirm a write request', type: 'boolean' };
const dryRunOption: ServiceCliOption = { name: 'dry-run', description: 'Preview the change without applying it; does not require --yes', type: 'boolean' };

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
const cell = (value: unknown) => (value === undefined || value === null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value));

function zoneTable(value: unknown): CliTable {
	const list = isRecord(value) && Array.isArray(value.zones) ? value.zones : [value];
	const rows = list.filter(isRecord);
	return { headers: ['name', 'kind', 'serial', 'id'], rows: rows.map((zone) => [cell(zone.name), cell(zone.kind), cell(zone.serial), cell(zone.id)]) };
}

function rrsetTable(value: unknown): CliTable {
	const rows: string[][] = [];
	for (const rrset of (isRecord(value) && Array.isArray(value.rrsets) ? value.rrsets : []).filter(isRecord)) {
		const values = Array.isArray(rrset.values) && rrset.values.length ? rrset.values : [''];
		for (const item of values) rows.push([cell(rrset.name), cell(rrset.type), cell(rrset.ttl), cell(item)]);
	}
	return { headers: ['name', 'type', 'ttl', 'value'], rows };
}

function arg(context: ServiceCliInputContext, index: number, label: string, allowApex = false): string {
	const value = context.args[index]?.trim();
	if (!value) throw new ServiceCliInputError(`DNS ${label} is required`);
	if (label !== 'record type' && !(allowApex && value === '@') && !isValidDnsName(value)) throw new ServiceCliInputError(`DNS ${label} is invalid`);
	if (label === 'record type' && !/^[A-Za-z0-9-]{1,32}$/u.test(value)) throw new ServiceCliInputError('DNS record type is invalid');
	return label === 'record type' ? value.toUpperCase() : value;
}

const pageOptions: ServiceCliOption[] = [
	{ name: 'limit', description: 'Maximum items per page' },
	{ name: 'cursor', description: 'Continue from a previous nextCursor' },
];

function page(context: ServiceCliInputContext): { limit?: number; cursor?: string } {
	const limitText = serviceCliString(context.options, 'limit');
	const cursor = serviceCliString(context.options, 'cursor');
	const limit = limitText === undefined ? undefined : Number(limitText);
	if (limitText !== undefined && (!/^\d+$/u.test(limitText) || !limit || limit > 10_000)) throw new ServiceCliInputError('--limit must be an integer between 1 and 10000');
	return { ...(limit === undefined ? {} : { limit }), ...(cursor ? { cursor } : {}) };
}

const dryRun = (context: ServiceCliInputContext) => context.options['dry-run'] === true;

function write(group: string, name: string, description: string, extra: Partial<Operation>, prepare: (context: ServiceCliInputContext) => Run): Operation {
	return {
		name, group, description, mutating: true, supportsDryRun: true, ...extra,
		options: [...(extra.options ?? []), yesOption, dryRunOption],
		async prepare(context) {
			// Confirmation precedes argument use, credential resolution and HTTP.
			if (!dryRun(context) && context.options.yes !== true) throw new ServiceCliInputError(`DNS ${group} ${name} requires --yes`);
			return prepare(context);
		},
	};
}

const flag = (context: ServiceCliInputContext) => (dryRun(context) ? { dryRun: true } : {});

const commands: Operation[] = [
	{
		name: 'list', group: 'zone', aliases: ['ls'], description: 'List DNS zones', table: zoneTable,
		options: [{ name: 'name', description: 'Only return this zone' }, ...pageOptions],
		async prepare(context) {
			const name = serviceCliString(context.options, 'name');
			if (name !== undefined && !isValidDnsName(name)) throw new ServiceCliInputError('DNS zone name is invalid');
			const input = { ...(name === undefined ? {} : { name }), ...page(context) };
			return (service, options) => service.listZone(input, options);
		},
	},
	{
		name: 'get', group: 'zone', argument: 'zone', description: 'Read one DNS zone', table: zoneTable,
		async prepare(context) {
			const input = { zone: arg(context, 0, 'zone') };
			return (service, options) => service.getZone(input, options);
		},
	},
	write('zone', 'create', 'Create a DNS zone; requires --yes unless --dry-run is set', {
		argument: 'zone',
		options: [
			{ name: 'kind', description: 'Supplier zone kind, for example Native for PowerDNS' },
			{ name: 'nameserver', description: 'Apex NS name; repeatable', repeatable: true },
		],
	}, (context) => {
		const nameservers = context.options.nameserver === undefined ? undefined : ([] as string[]).concat(context.options.nameserver as string | string[]);
		if (nameservers?.some((value) => !isValidDnsName(value))) throw new ServiceCliInputError('--nameserver is invalid');
		const kind = serviceCliString(context.options, 'kind');
		const input = { zone: arg(context, 0, 'zone'), ...(kind ? { kind } : {}), ...(nameservers ? { nameservers } : {}), ...flag(context) };
		return (service, options) => service.createZone(input, options);
	}),
	write('zone', 'delete', 'Delete a DNS zone and all its records; requires --yes unless --dry-run is set', { argument: 'zone', aliases: ['rm'] }, (context) => {
		const input = { zone: arg(context, 0, 'zone'), ...flag(context) };
		return (service, options) => service.deleteZone(input, options);
	}),
	{
		name: 'list', group: 'record', aliases: ['ls'], argument: 'zone', description: 'List RRSets of a zone', table: rrsetTable,
		options: [{ name: 'name', description: 'Filter by record name; @ is the apex' }, { name: 'type', description: 'Filter by record type' }, ...pageOptions],
		async prepare(context) {
			const name = serviceCliString(context.options, 'name');
			const type = serviceCliString(context.options, 'type');
			if (name !== undefined && name !== '@' && !isValidDnsName(name)) throw new ServiceCliInputError('--name is invalid');
			if (type !== undefined && !/^[A-Za-z0-9-]{1,32}$/u.test(type)) throw new ServiceCliInputError('--type is invalid');
			const input = { zone: arg(context, 0, 'zone'), ...(name ? { name } : {}), ...(type ? { type: type.toUpperCase() } : {}), ...page(context) };
			return (service, options) => service.listRecord(input, options);
		},
	},
	write('record', 'set', 'Replace the whole RRSet for a name and type with the given enabled values in zone-file format; disabled records are removed; requires --yes unless --dry-run is set', {
		arguments: '<zone> <name> <type> <value...>',
		options: [{ name: 'ttl', description: 'TTL in seconds (default 300)' }],
		examples: [{ command: 'woctl dns record set example.com @ TXT \'"v=spf1 -all"\' --yes', description: 'Values use zone-file format; TXT must be quoted' }],
	}, (context) => {
		const values = context.args.slice(3);
		if (!values.length) throw new ServiceCliInputError('DNS record value is required');
		const ttlText = serviceCliString(context.options, 'ttl');
		const ttl = ttlText === undefined ? 300 : Number(ttlText);
		if (!/^\d+$/u.test(ttlText ?? '300') || !Number.isSafeInteger(ttl) || ttl > 2_147_483_647) throw new ServiceCliInputError('--ttl must be a non-negative integer');
		const input = { zone: arg(context, 0, 'zone'), name: arg(context, 1, 'record name', true), type: arg(context, 2, 'record type'), ttl, values, ...flag(context) };
		return (service, options) => service.setRecord(input, options);
	}),
	write('record', 'delete', 'Delete the RRSet for a name and type; requires --yes unless --dry-run is set', {
		arguments: '<zone> <name> <type>', aliases: ['rm'],
	}, (context) => {
		const input = { zone: arg(context, 0, 'zone'), name: arg(context, 1, 'record name', true), type: arg(context, 2, 'record type'), ...flag(context) };
		return (service, options) => service.deleteRecord(input, options);
	}),
];

/** Provider-neutral `dns zone|record` commands; any provider of `DnsServiceCapability` can back them. */
export const DnsCliDefinition: ServiceCliDefinition<IDnsService> = {
	name: 'dns',
	description: 'Manage DNS zones and RRSets through a configured DNS provider',
	options: [],
	commands,
};
