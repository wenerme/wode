import {
	AlidnsClient,
	AlidnsClientError,
	type AlidnsDomain,
	type AlidnsPreparedRequest,
	type AlidnsRecord,
	type AlidnsRecordInput,
	type AlidnsRequestOptions,
} from '@wener/client/alicloud';
import { z } from 'zod';
import type { DnsRRSet, DnsZone } from '../../dns/DnsServiceContract';
import { DnsServiceCapability, type IDnsService } from '../../dns/IDnsService';
import { normalizeDnsName, normalizeDnsRecordName, sameDnsName } from '../../dns/name';
import { DnsOperations } from '../../dns/operations';
import {
	absoluteTarget,
	bareTarget,
	DnsTargetTypes,
	formatCaa,
	formatMx,
	formatSrv,
	formatRawTxt,
	parseCaa,
	parseMx,
	parseSrv,
	parseTxtValue,
} from '../../dns/rdata';
import { DnsOperationScope, type DnsOperationState, formatPageCursor, pageLocally, parsePageCursor, planDnsRecordChanges } from '../../dns/rrset';
import type { ServiceProviderDefinition } from '../../registry';
import type { ServiceProviderContext } from '../../runtime/types';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
export const AlidnsServiceOptionsSchema = Object.assign(
	z.strictObject({
		accessKeyId: z.string().min(1).optional(),
		accessKeyIdEnv: envName.optional(),
		accessKeySecret: z.string().min(1).optional(),
		accessKeySecretEnv: envName.optional(),
		endpoint: z.string().regex(/^[A-Za-z0-9.-]{1,253}$/u).optional(),
		timeoutMs: z.number().int().min(1).max(3_600_000).optional(),
	}),
	{
		jsonSchema: {
			type: 'object',
			properties: {
				accessKeyId: { type: 'string', description: 'AccessKey id; prefer accessKeyIdEnv.' },
				accessKeyIdEnv: { type: 'string', description: 'Environment variable holding the AccessKey id.' },
				accessKeySecret: { type: 'string', description: 'AccessKey secret; prefer accessKeySecretEnv.' },
				accessKeySecretEnv: { type: 'string', description: 'Environment variable holding the AccessKey secret.' },
				endpoint: { type: 'string', description: 'API host (default alidns.aliyuncs.com).' },
				timeoutMs: { type: 'integer', minimum: 1, description: 'Deadline of one whole DNS operation (default 30000).' },
			},
			additionalProperties: false,
		},
	},
);
export type AlidnsServiceOptions = z.output<typeof AlidnsServiceOptionsSchema>;

const DEFAULT_TIMEOUT_MS = 30_000;
const RECORD_PAGE_SIZE = 500;
const DOMAIN_PAGE_SIZE = 100;
const MAX_PAGES = 1_000;
const DEFAULT_LINE = 'default';

const bare = (name: string) => (name.endsWith('.') ? name.slice(0, -1) : name);

/** Absolute owner -> Alidns RR (relative to the domain, `@` for the apex). */
export function alidnsRR(owner: string, zone: string): string {
	const name = normalizeDnsName(owner).toLowerCase();
	const domain = normalizeDnsName(zone).toLowerCase();
	if (name === domain) return '@';
	if (!name.endsWith(`.${domain}`)) throw new TypeError('DNS record name is outside the zone');
	return normalizeDnsName(owner).slice(0, -(domain.length + 1));
}

/** Alidns RR -> absolute owner name. */
export function alidnsOwner(rr: string, zone: string): string {
	const domain = normalizeDnsName(zone);
	return rr === '@' || rr === '' ? domain : `${rr}.${domain}`;
}

/** Alidns record -> presentation-format value. */
export function alidnsRecordValue(record: Pick<AlidnsRecord, 'Type' | 'Value' | 'Priority'>): string {
	const type = record.Type.toUpperCase();
	const value = String(record.Value ?? '');
	switch (type) {
		case 'MX':
			return formatMx({ priority: Number(record.Priority ?? 0), target: absoluteTarget(value) });
		case 'SRV':
			return formatSrv(parseSrv(value));
		case 'CAA':
			return formatCaa(parseCaa(value));
		case 'TXT':
		case 'SPF':
			// Alidns stores unquoted text; boundaries are not preserved, so split at 255 bytes.
			return formatRawTxt(value);
		default:
			return DnsTargetTypes.has(type) ? absoluteTarget(value) : value;
	}
}

/** Lenient read: unparsable RDATA keeps the raw Value and is flagged `unparsed`. */
export function readAlidnsRecordValue(record: Pick<AlidnsRecord, 'Type' | 'Value' | 'Priority'>): { value: string; unparsed?: true } {
	try {
		return { value: alidnsRecordValue(record) };
	} catch {
		return { value: String(record.Value ?? ''), unparsed: true };
	}
}

/** Presentation-format value -> Alidns Value/Priority. Multi-string TXT is concatenated. */
export function alidnsRecordInput(type: string, value: string): Pick<AlidnsRecordInput, 'Value' | 'Priority'> {
	const kind = type.toUpperCase();
	switch (kind) {
		case 'MX': {
			const mx = parseMx(value);
			return { Value: bareTarget(mx.target), Priority: mx.priority };
		}
		case 'SRV': {
			const srv = parseSrv(value);
			return { Value: `${srv.priority} ${srv.weight} ${srv.port} ${bareTarget(srv.target)}` };
		}
		case 'CAA':
			return { Value: formatCaa(parseCaa(value)) };
		case 'TXT':
		case 'SPF':
			return { Value: parseTxtValue(value).join('') };
		default:
			return { Value: DnsTargetTypes.has(kind) ? bareTarget(value) : value.trim() };
	}
}

export function toAlidnsZone(domain: AlidnsDomain): DnsZone {
	const { DomainId, DomainName, ...rest } = domain;
	return {
		id: typeof DomainId === 'string' && DomainId ? DomainId : normalizeDnsName(DomainName),
		name: normalizeDnsName(DomainName),
		...(Object.keys(rest).length ? { metadata: rest } : {}),
	};
}

const isDisabled = (record: AlidnsRecord) => String(record.Status ?? '').toUpperCase() === 'DISABLE';
const isDefaultLine = (record: AlidnsRecord) => (record.Line ?? DEFAULT_LINE) === DEFAULT_LINE;
const isActive = (record: AlidnsRecord) => !isDisabled(record) && isDefaultLine(record);

/** Lower-cased ASCII (punycode) form of a domain name; browser-safe via the URL parser. */
export function asciiDomain(name: string): string {
	const text = bare(name.trim()).toLowerCase();
	if (/^[\x00-\x7f]*$/u.test(text)) return text;
	try {
		return new URL(`http://${text}/`).hostname;
	} catch {
		return text;
	}
}

/**
 * Groups Alidns records by RR+Type. `values` are the enabled records on the default line;
 * disabled records go to `metadata.disabledValues`, other resolution lines to `metadata.lineRecords`.
 */
export function groupAlidnsRecords(records: AlidnsRecord[], zone: string): DnsRRSet[] {
	const groups = new Map<string, AlidnsRecord[]>();
	for (const record of records) {
		const key = `${record.RR.toLowerCase()}\u0000${record.Type.toUpperCase()}`;
		groups.set(key, [...(groups.get(key) ?? []), record]);
	}
	return [...groups.values()].map((items) => {
		const active = items.filter(isActive);
		const first = active[0] ?? items[0]!;
		const disabledValues = items.filter((item) => isDisabled(item) && isDefaultLine(item)).map((item) => readAlidnsRecordValue(item).value);
		const lineRecords = items
			.filter((item) => !isDefaultLine(item))
			.map((item) => ({ id: item.RecordId, line: item.Line, value: readAlidnsRecordValue(item).value, ttl: item.TTL, ...(isDisabled(item) ? { disabled: true } : {}) }));
		const entries = active.map((item) => ({ id: item.RecordId, ...readAlidnsRecordValue(item), ...(item.TTL !== first.TTL ? { ttl: item.TTL } : {}), ...(item.Locked ? { locked: true } : {}), ...(item.Remark ? { remark: item.Remark } : {}) }));
		return {
			name: alidnsOwner(first.RR, zone),
			type: first.Type.toUpperCase(),
			ttl: Number(first.TTL ?? 0),
			values: entries.map((entry) => entry.value),
			metadata: {
				records: entries,
				...(entries.some((entry) => entry.unparsed) ? { unparsedValues: entries.filter((entry) => entry.unparsed).map((entry) => entry.value) } : {}),
				...(disabledValues.length ? { disabledValues } : {}),
				...(lineRecords.length ? { lineRecords } : {}),
			},
		};
	});
}

/**
 * Raised when a multi-request change stops after it may have changed state: `applied` succeeded,
 * `unknown` was in flight when the operation timed out, was closed or aborted (its outcome is
 * unknown), and `pending` was not applied (rejected by Alidns or never sent).
 */
export class AlidnsPartialChangeError extends Error {
	readonly applied: AlidnsPreparedRequest[];
	readonly unknown: AlidnsPreparedRequest[];
	readonly pending: AlidnsPreparedRequest[];
	constructor(applied: AlidnsPreparedRequest[], unknown: AlidnsPreparedRequest[], pending: AlidnsPreparedRequest[], cause: unknown) {
		super(
			`Alidns change partially applied: ${applied.length} applied, ${unknown.length} unknown, ${pending.length} not applied of ${applied.length + unknown.length + pending.length} requests`,
			{ cause },
		);
		this.name = 'AlidnsPartialChangeError';
		this.applied = applied;
		this.unknown = unknown;
		this.pending = pending;
	}
}

export interface AlidnsDnsServiceInit {
	readOnly: boolean;
	options: AlidnsServiceOptions;
	/** Called lazily on the first operation that needs the network; resolves credentials. */
	createClient(): AlidnsClient;
}

/**
 * Portable `IDnsService` over Alidns. Alidns has no transactional batch: `setRecord` sends
 * updates, then creates, then deletes as separate requests, and reports partial application.
 */
export function createAlidnsDnsService(init: AlidnsDnsServiceInit): IDnsService {
	const { readOnly, options } = init;
	const scope = new DnsOperationScope(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
	let client: AlidnsClient | undefined;
	const getClient = () => (client ??= init.createClient());
	const writable = () => {
		if (readOnly) throw new Error('Selected service is read-only');
	};
	const req = (signal: AbortSignal): AlidnsRequestOptions => ({ signal });
	const domainOf = (zone: string) => {
		const name = normalizeDnsName(zone);
		if (name === '.') throw new TypeError('Alidns does not host the root zone');
		return bare(name);
	};
	// Prepared requests are validated and built locally; no client or credentials are needed.
	const prepare = new AlidnsClient({ accessKeyId: 'preview', accessKeySecret: 'preview', fetch: async () => { throw new Error('preview only'); } });

	async function findDomain(zone: string, signal: AbortSignal): Promise<AlidnsDomain> {
		const domain = domainOf(zone);
		const ascii = asciiDomain(domain);
		const matches = (item: AlidnsDomain) =>
			sameDnsName(bare(item.DomainName), domain) || asciiDomain(item.DomainName) === ascii || (typeof item.PunyCode === 'string' && asciiDomain(item.PunyCode) === ascii);
		for (const keyWord of new Set([domain, ascii])) {
			const { items } = await getClient().describeDomains({ keyWord, searchMode: 'EXACT', pageSize: DOMAIN_PAGE_SIZE }, req(signal));
			const found = items.find(matches);
			if (found) return found;
		}
		// IDN given as punycode while Alidns keys the Unicode name: scan and compare PunyCode.
		if (ascii.split('.').some((label) => label.startsWith('xn--'))) {
			for (let page = 1; page <= MAX_PAGES; page++) {
				const result = await getClient().describeDomains({ pageNumber: page, pageSize: DOMAIN_PAGE_SIZE }, req(signal));
				const found = result.items.find(matches);
				if (found) return found;
				if (!result.items.length || page * DOMAIN_PAGE_SIZE >= result.totalCount) break;
			}
		}
		throw new Error('DNS zone not found');
	}

	async function recordsOf(domain: string, filter: { rr?: string; type?: string }, signal: AbortSignal): Promise<AlidnsRecord[]> {
		const all: AlidnsRecord[] = [];
		for (let page = 1; page <= MAX_PAGES; page++) {
			const result = await getClient().describeDomainRecords(
				{ domainName: domain, ...(filter.rr ? { rrKeyWord: filter.rr } : {}), ...(filter.type ? { type: filter.type } : {}), pageNumber: page, pageSize: RECORD_PAGE_SIZE },
				req(signal),
			);
			all.push(...result.items);
			if (!result.items.length || page * RECORD_PAGE_SIZE >= result.totalCount) break;
		}
		return all.filter((record) => (filter.rr === undefined || record.RR.toLowerCase() === filter.rr.toLowerCase()) && (filter.type === undefined || record.Type.toUpperCase() === filter.type));
	}

	/**
	 * Sends requests in order. Progress lives outside the deadline race so that a timeout, close or
	 * abort still reports what was applied; the in-flight request is reported as `unknown`.
	 */
	async function apply(requests: AlidnsPreparedRequest[], signal: AbortSignal, state: DnsOperationState) {
		let applied = 0;
		let inFlight: number | undefined;
		const partial = (cause: unknown) => {
			const unknown = inFlight === undefined ? [] : [requests[inFlight]!];
			const next = inFlight === undefined ? applied : inFlight + 1;
			return new AlidnsPartialChangeError(requests.slice(0, applied), unknown, requests.slice(next), cause);
		};
		state.mapAbortError = (error) => (applied > 0 || inFlight !== undefined ? partial(error) : error);
		for (const [index, request] of requests.entries()) {
			inFlight = index;
			try {
				await getClient().request(request, req(signal));
			} catch (error) {
				if (signal.aborted) throw error;
				// Only a response carrying an API error code proves the request was not applied;
				// a transport failure may have reached the server, so its outcome stays unknown.
				const definite = error instanceof AlidnsClientError && error.apiCode !== undefined;
				if (definite) inFlight = undefined;
				if (!applied && definite) throw error;
				throw partial(error);
			}
			inFlight = undefined;
			applied++;
		}
	}

	const service: IDnsService = {
		type: 'dns',
		provider: 'alidns',
		readOnly,
		async listZone(input, callOptions) {
			return scope.run(callOptions, async (signal) => {
				const keyWord = input?.name === undefined ? undefined : domainOf(input.name);
				const filter = { ...(keyWord ? { keyWord, searchMode: 'EXACT' as const } : {}) };
				if (input?.limit !== undefined) {
					const pageSize = Math.min(input.limit, DOMAIN_PAGE_SIZE);
					const { page } = parsePageCursor(input.cursor, pageSize);
					const result = await getClient().describeDomains({ ...filter, pageNumber: page, pageSize }, req(signal));
					const more = result.items.length > 0 && page * pageSize < result.totalCount;
					return { zones: result.items.map(toAlidnsZone), ...(more ? { nextCursor: formatPageCursor(page + 1, pageSize) } : {}) };
				}
				const zones: DnsZone[] = [];
				const start = parsePageCursor(input?.cursor);
				const pageSize = start.size ?? DOMAIN_PAGE_SIZE;
				for (let page = start.page; page <= MAX_PAGES; page++) {
					const result = await getClient().describeDomains({ ...filter, pageNumber: page, pageSize }, req(signal));
					zones.push(...result.items.map(toAlidnsZone));
					if (!result.items.length || page * pageSize >= result.totalCount) break;
				}
				return { zones };
			});
		},
		async getZone(input, callOptions) {
			return scope.run(callOptions, async (signal) => toAlidnsZone(await findDomain(input.zone, signal)));
		},
		async createZone({ dryRun, zone, kind, nameservers }, callOptions) {
			if (kind !== undefined || nameservers?.length) throw new TypeError('Alidns createZone does not support kind or nameservers');
			const request = prepare.prepareAddDomain({ domainName: domainOf(zone) });
			const name = normalizeDnsName(zone);
			if (dryRun === true) return { ok: true as const, dryRun: true, zone: { id: name, name }, request };
			writable();
			return scope.run(callOptions, async (signal) => {
				const result = await getClient().request(request, req(signal));
				return { ok: true as const, zone: toAlidnsZone({ ...(result as AlidnsDomain), DomainName: String(result.DomainName ?? bare(name)) }) };
			});
		},
		async deleteZone({ dryRun, zone }, callOptions) {
			const request = prepare.prepareDeleteDomain({ domainName: domainOf(zone) });
			const name = normalizeDnsName(zone);
			if (dryRun === true) return { ok: true as const, dryRun: true, zone: { id: name, name }, request };
			writable();
			return scope.run(callOptions, async (signal) => {
				await getClient().request(request, req(signal));
				return { ok: true as const };
			});
		},
		async listRecord({ zone, name, type, cursor, limit }, callOptions) {
			return scope.run(callOptions, async (signal) => {
				const domain = domainOf(zone);
				const rr = name === undefined ? undefined : alidnsRR(normalizeDnsRecordName(name, zone), zone);
				const kind = type?.toUpperCase();
				const records = await recordsOf(domain, { ...(rr ? { rr } : {}), ...(kind ? { type: kind } : {}) }, signal);
				const { items, nextCursor } = pageLocally(groupAlidnsRecords(records, zone), { cursor, limit });
				return { rrsets: items, ...(nextCursor ? { nextCursor } : {}) };
			});
		},
		/**
		 * Scoped to the default resolution line; other lines are preserved. Disabled default-line
		 * records are deleted first (so re-adding the same value cannot hit DomainRecordDuplicate),
		 * then enabled ones are updated in place, new ones added and leftovers deleted. Not atomic.
		 */
		async setRecord({ dryRun, zone, name, type, ttl, values }, callOptions) {
			if (dryRun !== true) writable();
			return scope.run(callOptions, async (signal, state) => {
				const kind = type.toUpperCase();
				const domain = domainOf(zone);
				const owner = normalizeDnsRecordName(name, zone);
				const rr = alidnsRR(owner, zone);
				const inputs = values.map((value) => alidnsRecordInput(kind, value));
				const desired = inputs.map((input) => alidnsRecordValue({ Type: kind, ...input }));
				const records = (await recordsOf(domain, { rr, type: kind }, signal)).filter(isDefaultLine);
				const plan = planDnsRecordChanges({
					type: kind,
					ttl,
					values: desired,
					existing: records.filter(isActive).map((record) => ({ record, value: readAlidnsRecordValue(record).value, ttl: Number(record.TTL) })),
				});
				const body = (value: string): AlidnsRecordInput => ({ RR: rr, Type: kind, TTL: ttl, ...alidnsRecordInput(kind, value) });
				const requests = [
					...records.filter(isDisabled).map((record) => prepare.prepareDeleteDomainRecord({ recordId: record.RecordId })),
					...plan.update.map(({ record, value }) => prepare.prepareUpdateDomainRecord({ recordId: record.RecordId, ...body(value), Line: DEFAULT_LINE })),
					...plan.create.map((value) => prepare.prepareAddDomainRecord({ domainName: domain, ...body(value) })),
					...plan.delete.map((record) => prepare.prepareDeleteDomainRecord({ recordId: record.RecordId })),
				];
				const rrset = { name: owner, type: kind, ttl, values: desired };
				const request = { requests, atomic: false };
				if (dryRun === true) return { ok: true as const, dryRun: true, rrset, request };
				await apply(requests, signal, state);
				return { ok: true as const, rrset, request };
			});
		},
		/** Deletes the default-line records (enabled and disabled); other lines are preserved. */
		async deleteRecord({ dryRun, zone, name, type }, callOptions) {
			if (dryRun !== true) writable();
			return scope.run(callOptions, async (signal, state) => {
				const kind = type.toUpperCase();
				const domain = domainOf(zone);
				const rr = alidnsRR(normalizeDnsRecordName(name, zone), zone);
				const records = (await recordsOf(domain, { rr, type: kind }, signal)).filter(isDefaultLine);
				const requests = records.map((record) => prepare.prepareDeleteDomainRecord({ recordId: record.RecordId }));
				const request = { requests, atomic: false };
				if (dryRun === true) return { ok: true as const, dryRun: true, request };
				await apply(requests, signal, state);
				return { ok: true as const, request };
			});
		},
		async close() {
			scope.close();
			await client?.close();
		},
		[Symbol.asyncDispose]() {
			return this.close();
		},
	};
	return service;
}

function credential(value: string | undefined, env: string | undefined, getEnv: ((name: string) => string | undefined) | undefined, label: string): string {
	if (env === undefined) return value!;
	const resolved = getEnv?.(env);
	if (!resolved) throw new Error(`Alidns ${label} environment variable is unavailable`);
	return resolved;
}

/** Parses options at instance creation; the AccessKey is read on the first network operation. */
export function createAlidnsDnsServiceFromContext({ config, getEnv, fetch }: ServiceProviderContext): IDnsService {
	const parsed = AlidnsServiceOptionsSchema.safeParse(config.options ?? {});
	if (!parsed.success) throw new Error('Invalid Alidns service configuration');
	const options = parsed.data;
	for (const [value, env] of [
		[options.accessKeyId, options.accessKeyIdEnv],
		[options.accessKeySecret, options.accessKeySecretEnv],
	] as const) {
		if (value !== undefined && env !== undefined) throw new Error('Conflicting Alidns credential configuration');
		if (value === undefined && env === undefined) throw new Error('Alidns service requires accessKeyId(Env) and accessKeySecret(Env)');
	}
	return createAlidnsDnsService({
		readOnly: config.readOnly !== false,
		options,
		createClient() {
			return new AlidnsClient({
				accessKeyId: credential(options.accessKeyId, options.accessKeyIdEnv, getEnv, 'AccessKey id'),
				accessKeySecret: credential(options.accessKeySecret, options.accessKeySecretEnv, getEnv, 'AccessKey secret'),
				endpoint: options.endpoint,
				fetch,
				// The service deadline (DnsOperationScope) is the single timeout owner.
				timeoutMs: 0,
			});
		},
	});
}

export const AlidnsServiceProvider: ServiceProviderDefinition<IDnsService> = {
	name: 'alidns',
	title: 'Alibaba Cloud DNS',
	description: 'Alibaba Cloud DNS (Alidns) domains and records as portable RRSets; record writes are sequential, not atomic.',
	examples: [
		{ command: 'woctl dns zone list --service alidns', description: 'List domains.' },
		{ command: 'woctl dns record set example.com @ MX "10 mx.example.com." --dry-run', description: 'Preview an RRSet change.' },
	],
	aliases: ['aliyun-dns'],
	provides: [DnsServiceCapability],
	optionsSchema: AlidnsServiceOptionsSchema,
	operations: DnsOperations,
	create(context) {
		return { dns: createAlidnsDnsServiceFromContext(context) };
	},
};
