import { isPowerDnsWriteMethod, resolvePowerDnsMethod } from '@wener/client/powerdns';
import type { CliTable } from '../../../cli/render/CliTable';
import {
	type ServiceCliDefinition,
	type ServiceCliInputContext,
	type ServiceCliOperation,
	type ServiceCliOption,
	serviceCliString,
	serviceCliStrings,
} from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { IPowerDnsService } from '../IPowerDnsService';

type Operation = ServiceCliOperation<IPowerDnsService>;
type Run = Awaited<ReturnType<Operation['prepare']>>;

const MaxInputBytes = 1024 * 1024;
const serverOption: ServiceCliOption = { name: 'server-id', description: 'PowerDNS server id; defaults to the configured server' };
const yesOption: ServiceCliOption = { name: 'yes', description: 'Confirm a write request', type: 'boolean' };
const dryRunOption: ServiceCliOption = { name: 'dry-run', description: 'Preview the request without sending it; does not require --yes', type: 'boolean' };

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cell(value: unknown): string {
	if (value === undefined || value === null) return '';
	return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function table(headers: string[]) {
	return (value: unknown): CliTable => ({
		headers,
		rows: (Array.isArray(value) ? value : [value]).map((entry) => headers.map((key) => cell(isRecord(entry) ? entry[key] : undefined))),
	});
}

function server(context: ServiceCliInputContext): { server?: string } {
	const value = serviceCliString(context.options, 'server-id');
	return value === undefined ? {} : { server: value };
}

function required(context: ServiceCliInputContext, index: number, label: string): string {
	const value = context.args[index];
	if (value === undefined || !value.trim()) throw new ServiceCliInputError(`PowerDNS ${label} is required`);
	return value;
}

function integer(value: string | undefined, option: string, minimum: number): number | undefined {
	if (value === undefined) return undefined;
	const parsed = Number(value);
	if (!/^\d+$/u.test(value.trim()) || !Number.isSafeInteger(parsed) || parsed < minimum)
		throw new ServiceCliInputError(`--${option} must be an integer greater than or equal to ${minimum}`);
	return parsed;
}

function bool(value: string | undefined, option: string): boolean | undefined {
	if (value === undefined) return undefined;
	if (value === 'true') return true;
	if (value === 'false') return false;
	throw new ServiceCliInputError(`--${option} must be true or false`);
}

/** Confirmation is checked before any file/stdin read, credential resolution or request. */
function confirm(context: ServiceCliInputContext, action: string, dryRun = false): void {
	if (!dryRun && context.options.yes !== true) throw new ServiceCliInputError(`PowerDNS ${action} requires --yes`);
}

const dryRun = (context: ServiceCliInputContext) => context.options['dry-run'] === true;

function read(group: string | undefined, name: string, description: string, extra: Partial<Operation>, prepare: (context: ServiceCliInputContext) => Run): Operation {
	return { name, group, description, ...extra, options: [serverOption, ...(extra.options ?? [])], prepare: async (context) => prepare(context) };
}

function write(
	group: string | undefined,
	name: string,
	description: string,
	extra: Partial<Operation> & { supportsDryRun?: boolean },
	prepare: (context: ServiceCliInputContext) => Run | Promise<Run>,
): Operation {
	return {
		name, group, description, mutating: true, ...extra,
		options: [serverOption, ...(extra.options ?? []), yesOption, ...(extra.supportsDryRun ? [dryRunOption] : [])],
		async prepare(context) {
			confirm(context, `${group ? `${group} ` : ''}${name}`, extra.supportsDryRun === true && dryRun(context));
			return prepare(context);
		},
	};
}

function query(context: ServiceCliInputContext): Record<string, string | string[]> {
	const params: Record<string, string | string[]> = Object.create(null);
	for (const value of serviceCliStrings(context.options, 'query') ?? []) {
		const at = value.indexOf('=');
		if (at < 1) throw new ServiceCliInputError('--query expects key=value');
		const key = value.slice(0, at);
		const entry = value.slice(at + 1);
		const previous = params[key];
		params[key] = previous === undefined ? entry : [...(Array.isArray(previous) ? previous : [previous]), entry];
	}
	return params;
}

const showSecretOption: ServiceCliOption = { name: 'show-secret', description: 'Reveal the TSIG key secret in the output', type: 'boolean' };
export const PowerDnsRedactedSecret = '[redacted]';

/** TSIG secrets are hidden unless --show-secret is set; other fields are kept. */
export function redactPowerDnsTsigKey(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(redactPowerDnsTsigKey);
	if (isRecord(value) && typeof value.key === 'string' && value.key) return { ...value, key: PowerDnsRedactedSecret };
	return value;
}

const secret = (context: ServiceCliInputContext) => (value: unknown) => (context.options['show-secret'] === true ? value : redactPowerDnsTsigKey(value));

async function body(context: ServiceCliInputContext, value: string, label: string): Promise<unknown> {
	const text = await context.readText(value, { label, maxBytes: MaxInputBytes });
	try {
		return JSON.parse(text) as unknown;
	} catch {
		throw new ServiceCliInputError('--body must contain valid JSON');
	}
}

const commands: Operation[] = [
	read(undefined, 'status', 'Read the configured PowerDNS server', {}, (context) => {
		const input = server(context);
		return (service, options) => service.getServer(input, options);
	}),
	read('server', 'list', 'List PowerDNS servers', { table: table(['id', 'daemon_type', 'version', 'url']), options: [] }, () => (service, options) => service.listServer({}, options)),
	read('server', 'get', 'Read one PowerDNS server', {}, (context) => {
		const input = server(context);
		return (service, options) => service.getServer(input, options);
	}),
	read('server', 'stats', 'Read server statistics', { table: table(['name', 'type', 'value']) }, (context) => {
		const input = server(context);
		return (service, options) => service.listServerStatistic(input, options);
	}),
	read(undefined, 'search', 'Search zones, records and comments; * and ? are wildcards', {
		argument: 'query',
		table: table(['object_type', 'name', 'type', 'content', 'zone']),
		options: [{ name: 'max', description: 'Maximum number of results (default 100)' }, { name: 'object-type', description: 'all, zone, record or comment' }],
	}, (context) => {
		const objectType = serviceCliString(context.options, 'object-type');
		if (objectType !== undefined && !['all', 'zone', 'record', 'comment'].includes(objectType))
			throw new ServiceCliInputError('--object-type must be all, zone, record or comment');
		const input = {
			...server(context),
			query: required(context, 0, 'search query'),
			max: integer(serviceCliString(context.options, 'max'), 'max', 1),
			objectType: objectType as 'all' | 'zone' | 'record' | 'comment' | undefined,
		};
		return (service, options) => service.searchData(input, options);
	}),
	write('zone', 'create', 'Create a zone with PowerDNS-specific fields; requires --yes unless --dry-run is set', {
		argument: 'zone',
		supportsDryRun: true,
		options: [
			{ name: 'kind', description: 'Native, Master, Slave, Producer or Consumer (default Native)' },
			{ name: 'master', description: 'Primary server address for Slave/Consumer zones; repeatable', repeatable: true },
			{ name: 'nameserver', description: 'Apex NS name; repeatable', repeatable: true },
			{ name: 'account', description: 'Zone account' },
			{ name: 'dnssec', description: 'Sign the zone', type: 'boolean' },
		],
	}, (context) => {
		const kind = serviceCliString(context.options, 'kind');
		if (kind !== undefined && !['Native', 'Master', 'Slave', 'Producer', 'Consumer'].includes(kind))
			throw new ServiceCliInputError('--kind must be Native, Master, Slave, Producer or Consumer');
		const masters = serviceCliStrings(context.options, 'master');
		if (masters?.length && kind !== 'Slave' && kind !== 'Consumer') throw new ServiceCliInputError('--master requires --kind Slave or Consumer');
		const input = {
			...server(context),
			zone: required(context, 0, 'zone'),
			...(kind ? { kind: kind as 'Native' } : {}),
			...(masters ? { masters } : {}),
			...(serviceCliStrings(context.options, 'nameserver') ? { nameservers: serviceCliStrings(context.options, 'nameserver') } : {}),
			...(serviceCliString(context.options, 'account') !== undefined ? { account: serviceCliString(context.options, 'account') } : {}),
			...(context.options.dnssec === true ? { dnssec: true } : {}),
			...(dryRun(context) ? { dryRun: true } : {}),
		};
		return (service, options) => service.createPowerDnsZone(input, options);
	}),
	write('zone', 'notify', 'Send DNS NOTIFY to the zone secondaries; requires --yes', { argument: 'zone' }, (context) => {
		const input = { ...server(context), zone: required(context, 0, 'zone') };
		return (service, options) => service.notifyZone(input, options);
	}),
	write('zone', 'axfr-retrieve', 'Retrieve a secondary zone from its primary; requires --yes', { argument: 'zone' }, (context) => {
		const input = { ...server(context), zone: required(context, 0, 'zone') };
		return (service, options) => service.retrieveZoneAxfr(input, options);
	}),
	read('metadata', 'list', 'List zone metadata', { argument: 'zone', table: table(['kind', 'metadata']) }, (context) => {
		const input = { ...server(context), zone: required(context, 0, 'zone') };
		return (service, options) => service.listMetadata(input, options);
	}),
	read('metadata', 'get', 'Read one zone metadata kind', { arguments: '<zone> <kind>' }, (context) => {
		const input = { ...server(context), zone: required(context, 0, 'zone'), kind: required(context, 1, 'metadata kind') };
		return (service, options) => service.getMetadata(input, options);
	}),
	write('metadata', 'set', 'Replace all values of one metadata kind; requires --yes', { arguments: '<zone> <kind> <value...>' }, (context) => {
		const input = { ...server(context), zone: required(context, 0, 'zone'), kind: required(context, 1, 'metadata kind'), values: context.args.slice(2) };
		if (!input.values.length) throw new ServiceCliInputError('PowerDNS metadata value is required');
		return (service, options) => service.setMetadata(input, options);
	}),
	write('metadata', 'delete', 'Delete one metadata kind; requires --yes', { arguments: '<zone> <kind>', aliases: ['rm'] }, (context) => {
		const input = { ...server(context), zone: required(context, 0, 'zone'), kind: required(context, 1, 'metadata kind') };
		return (service, options) => service.deleteMetadata(input, options);
	}),
	read('cryptokey', 'list', 'List DNSSEC cryptokeys of a zone', { argument: 'zone', table: table(['id', 'keytype', 'active', 'published', 'algorithm', 'bits']) }, (context) => {
		const input = { ...server(context), zone: required(context, 0, 'zone') };
		return (service, options) => service.listCryptokey(input, options);
	}),
	read('cryptokey', 'get', 'Read one DNSSEC cryptokey', { arguments: '<zone> <id>' }, (context) => {
		const input = { ...server(context), zone: required(context, 0, 'zone'), id: integer(required(context, 1, 'cryptokey id'), 'id', 0)! };
		return (service, options) => service.getCryptokey(input, options);
	}),
	write('cryptokey', 'create', 'Create a DNSSEC cryptokey; requires --yes', {
		argument: 'zone',
		options: [
			{ name: 'keytype', description: 'ksk, zsk or csk (default csk)' },
			{ name: 'algorithm', description: 'Key algorithm, for example ecdsa256' },
			{ name: 'bits', description: 'Key size in bits' },
			{ name: 'inactive', description: 'Create the key inactive', type: 'boolean' },
		],
	}, (context) => {
		const keytype = serviceCliString(context.options, 'keytype');
		if (keytype !== undefined && !['ksk', 'zsk', 'csk'].includes(keytype)) throw new ServiceCliInputError('--keytype must be ksk, zsk or csk');
		const input = {
			...server(context),
			zone: required(context, 0, 'zone'),
			keytype: keytype as 'csk' | undefined,
			algorithm: serviceCliString(context.options, 'algorithm'),
			bits: integer(serviceCliString(context.options, 'bits'), 'bits', 1),
			active: context.options.inactive !== true,
		};
		return (service, options) => service.createCryptokey(input, options);
	}),
	write('cryptokey', 'update', 'Change cryptokey active/published state; requires --yes', {
		arguments: '<zone> <id>',
		options: [{ name: 'active', description: 'true or false' }, { name: 'published', description: 'true or false' }],
	}, (context) => {
		const active = bool(serviceCliString(context.options, 'active'), 'active');
		const published = bool(serviceCliString(context.options, 'published'), 'published');
		if (active === undefined && published === undefined) throw new ServiceCliInputError('--active or --published is required');
		const input = {
			...server(context),
			zone: required(context, 0, 'zone'),
			id: integer(required(context, 1, 'cryptokey id'), 'id', 0)!,
			...(active === undefined ? {} : { active }),
			...(published === undefined ? {} : { published }),
		};
		return (service, options) => service.updateCryptokey(input, options);
	}),
	write('cryptokey', 'delete', 'Delete a DNSSEC cryptokey; requires --yes', { arguments: '<zone> <id>', aliases: ['rm'] }, (context) => {
		const input = { ...server(context), zone: required(context, 0, 'zone'), id: integer(required(context, 1, 'cryptokey id'), 'id', 0)! };
		return (service, options) => service.deleteCryptokey(input, options);
	}),
	read('tsigkey', 'list', 'List TSIG keys', { table: table(['id', 'name', 'algorithm']), options: [showSecretOption] }, (context) => {
		const input = server(context);
		const output = secret(context);
		return async (service, options) => output(await service.listTsigKey(input, options));
	}),
	read('tsigkey', 'get', 'Read one TSIG key; the secret is redacted unless --show-secret is set', { argument: 'id', options: [showSecretOption] }, (context) => {
		const input = { ...server(context), id: required(context, 0, 'TSIG key id') };
		const output = secret(context);
		return async (service, options) => output(await service.getTsigKey(input, options));
	}),
	write('tsigkey', 'create', 'Create a TSIG key; requires --yes', {
		argument: 'name',
		options: [
			{ name: 'algorithm', description: 'TSIG algorithm (default hmac-sha256)' },
			{ name: 'key', description: 'Base64 secret as @file or - for stdin; generated when omitted' },
			showSecretOption,
		],
	}, async (context) => {
		const keyArg = serviceCliString(context.options, 'key');
		const key = keyArg === undefined ? undefined : (await context.readText(keyArg, { label: 'TSIG key secret', maxBytes: 4096 })).trim();
		const input = { ...server(context), name: required(context, 0, 'TSIG key name'), algorithm: serviceCliString(context.options, 'algorithm'), ...(key ? { key } : {}) };
		const output = secret(context);
		return async (service, options) => output(await service.createTsigKey(input, options));
	}),
	write('tsigkey', 'update', 'Rename a TSIG key or replace its algorithm or secret; requires --yes', {
		argument: 'id',
		options: [
			{ name: 'name', description: 'New key name' },
			{ name: 'algorithm', description: 'TSIG algorithm' },
			{ name: 'key', description: 'Base64 secret as @file or - for stdin' },
			showSecretOption,
		],
	}, async (context) => {
		const id = required(context, 0, 'TSIG key id');
		const name = serviceCliString(context.options, 'name');
		const algorithm = serviceCliString(context.options, 'algorithm');
		const keyArg = serviceCliString(context.options, 'key');
		if (name === undefined && algorithm === undefined && keyArg === undefined) throw new ServiceCliInputError('--name, --algorithm or --key is required');
		const key = keyArg === undefined ? undefined : (await context.readText(keyArg, { label: 'TSIG key secret', maxBytes: 4096 })).trim();
		const input = { ...server(context), id, name, algorithm, ...(key ? { key } : {}) };
		const output = secret(context);
		return async (service, options) => output(await service.updateTsigKey(input, options));
	}),
	write('tsigkey', 'delete', 'Delete a TSIG key; requires --yes', { argument: 'id', aliases: ['rm'] }, (context) => {
		const input = { ...server(context), id: required(context, 0, 'TSIG key id') };
		return (service, options) => service.deleteTsigKey(input, options);
	}),
	{
		name: 'api',
		argument: 'path',
		description: 'Call a PowerDNS API path relative to /api/v1; non-read methods or --body require --yes and a writable service. Raw responses are not redacted and may contain secrets such as TSIG keys',
		options: [
			{ name: 'method', aliases: ['X'], description: 'HTTP method; GET by default, POST with --body' },
			{ name: 'query', description: 'Query parameter key=value; repeatable', repeatable: true },
			{ name: 'body', description: 'JSON body, @file or - for stdin' },
			yesOption,
		],
		async prepare(context) {
			const path = required(context, 0, 'API path');
			const bodyArgument = serviceCliString(context.options, 'body');
			let method: ReturnType<typeof resolvePowerDnsMethod>;
			try {
				method = resolvePowerDnsMethod({ method: serviceCliString(context.options, 'method'), body: bodyArgument });
			} catch {
				throw new ServiceCliInputError('--method must be GET, HEAD, OPTIONS, POST, PUT, PATCH or DELETE');
			}
			if ((method === 'GET' || method === 'HEAD') && bodyArgument !== undefined) throw new ServiceCliInputError('--body cannot be used with GET or HEAD');
			if ((isPowerDnsWriteMethod(method) || bodyArgument !== undefined) && context.options.yes !== true)
				throw new ServiceCliInputError('PowerDNS API write requires --yes');
			const params = query(context);
			const payload = bodyArgument === undefined ? undefined : await body(context, bodyArgument, 'PowerDNS API body');
			const input = { path, method, query: params, ...(payload === undefined ? {} : { body: payload }) };
			return (service, options) => service.request(input, options);
		},
	},
];

export const PowerDnsCliDefinition: ServiceCliDefinition<IPowerDnsService> = {
	name: 'powerdns',
	aliases: ['pdns'],
	description: 'PowerDNS-only operations: servers, search, zone notify/AXFR, metadata, DNSSEC cryptokeys, TSIG keys and the raw API. Use `dns` for zones and records',
	options: [],
	commands,
};
