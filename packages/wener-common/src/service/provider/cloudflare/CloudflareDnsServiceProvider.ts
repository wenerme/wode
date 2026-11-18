import {
	CloudflareClient,
	prepareCloudflareCreateZone,
	type CloudflareDnsRecord,
	type CloudflareDnsRecordInput,
	type CloudflareRequestOptions,
	type CloudflareZone,
} from '@wener/client/cloudflare';
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
	isQuotedTxt,
	normalizeTxtValue,
	parseCaa,
	parseMx,
	parseSrv,
} from '../../dns/rdata';
import { DnsOperationScope, formatPageCursor, pageLocally, parsePageCursor, planDnsRecordChanges } from '../../dns/rrset';
import type { ServiceProviderDefinition } from '../../registry';
import type { ServiceProviderContext } from '../../runtime/types';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
export const CloudflareDnsServiceOptionsSchema = Object.assign(
	z.strictObject({
		apiToken: z.string().min(1).optional(),
		apiTokenEnv: envName.optional(),
		accountId: z.string().regex(/^[A-Za-z0-9]{1,64}$/u).optional(),
		timeoutMs: z.number().int().min(1).max(3_600_000).optional(),
		maxBatchChanges: z.number().int().min(1).max(100_000).optional(),
	}),
	{
		jsonSchema: {
			type: 'object',
			properties: {
				apiToken: { type: 'string', description: 'Cloudflare API token (Bearer); prefer apiTokenEnv.' },
				apiTokenEnv: { type: 'string', description: 'Environment variable holding the API token.' },
				accountId: { type: 'string', description: 'Account id used when creating zones.' },
				timeoutMs: { type: 'integer', minimum: 1, description: 'Deadline of one whole DNS operation (default 30000).' },
				maxBatchChanges: { type: 'integer', minimum: 1, description: 'Largest batch one setRecord/deleteRecord may send (default 200, the Cloudflare free plan limit).' },
			},
			additionalProperties: false,
		},
	},
);
export type CloudflareDnsServiceOptions = z.output<typeof CloudflareDnsServiceOptionsSchema>;

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_BATCH_CHANGES = 200;
const RECORD_PAGE_SIZE = 1_000;
const ZONE_PAGE_SIZE = 50;
const MAX_PAGES = 1_000;
const PROXIABLE = new Set(['A', 'AAAA', 'CNAME']);

const bare = (name: string) => (name.endsWith('.') ? name.slice(0, -1) : name);

/** Cloudflare record -> presentation-format value. */
export function cloudflareRecordValue(record: CloudflareDnsRecord): string {
	const type = record.type.toUpperCase();
	const content = typeof record.content === 'string' ? record.content : '';
	const data = record.data ?? {};
	switch (type) {
		case 'MX':
			return formatMx({ priority: Number(record.priority ?? data.priority ?? 0), target: absoluteTarget(content) });
		case 'SRV':
			if (typeof data.target === 'string') {
				return formatSrv({ priority: Number(data.priority ?? 0), weight: Number(data.weight ?? 0), port: Number(data.port ?? 0), target: data.target });
			}
			return formatSrv(parseSrv(`${record.priority ?? 0} ${content}`));
		case 'CAA':
			if (typeof data.tag === 'string') return formatCaa({ flags: Number(data.flags ?? 0), tag: data.tag, value: String(data.value ?? '') });
			return formatCaa(parseCaa(content));
		case 'TXT':
		case 'SPF':
			// Cloudflare stores quoted character-strings; legacy records may hold raw text.
			return isQuotedTxt(content) ? normalizeTxtValue(content) : formatRawTxt(content);
		default:
			return DnsTargetTypes.has(type) ? absoluteTarget(content) : content;
	}
}

/**
 * Lenient read: a record whose RDATA cannot be parsed (for example a malformed SRV or CAA) keeps
 * its raw content as the value and is flagged `unparsed`, so one bad record cannot fail a listing.
 */
export function readCloudflareRecordValue(record: CloudflareDnsRecord): { value: string; unparsed?: true } {
	try {
		return { value: cloudflareRecordValue(record) };
	} catch {
		const raw = typeof record.content === 'string' && record.content ? record.content : JSON.stringify(record.data ?? null);
		return { value: raw, unparsed: true };
	}
}

/** Presentation-format value -> Cloudflare record body (without name/ttl). */
export function cloudflareRecordInput(type: string, value: string): Omit<CloudflareDnsRecordInput, 'name' | 'type'> {
	const kind = type.toUpperCase();
	switch (kind) {
		case 'MX': {
			const mx = parseMx(value);
			return { content: bareTarget(mx.target), priority: mx.priority };
		}
		case 'SRV': {
			const srv = parseSrv(value);
			return { data: { priority: srv.priority, weight: srv.weight, port: srv.port, target: bareTarget(srv.target) } };
		}
		case 'CAA': {
			const caa = parseCaa(value);
			return { data: { flags: caa.flags, tag: caa.tag, value: caa.value } };
		}
		case 'TXT':
		case 'SPF':
			return { content: normalizeTxtValue(value) };
		default:
			return { content: DnsTargetTypes.has(kind) ? bareTarget(value) : value.trim() };
	}
}

export function toCloudflareDnsZone(zone: CloudflareZone): DnsZone {
	const { id, name, type, ...rest } = zone;
	return {
		id,
		name: normalizeDnsName(name),
		...(typeof type === 'string' ? { kind: type } : {}),
		...(Object.keys(rest).length ? { metadata: rest } : {}),
	};
}

/** Groups Cloudflare records by name+type into RRSets; ids, proxied, comments, tags and `ttl=1` (auto) go to metadata. */
export function groupCloudflareRecords(records: CloudflareDnsRecord[]): DnsRRSet[] {
	const groups = new Map<string, CloudflareDnsRecord[]>();
	for (const record of records) {
		const key = `${record.name.toLowerCase()}\u0000${record.type.toUpperCase()}`;
		groups.set(key, [...(groups.get(key) ?? []), record]);
	}
	return [...groups.values()].map((items) => {
		const first = items[0]!;
		const proxied = items.map((item) => item.proxied).filter((value): value is boolean => typeof value === 'boolean');
		const entries = items.map((item) => ({
			id: item.id,
			...readCloudflareRecordValue(item),
			...(item.ttl !== first.ttl ? { ttl: item.ttl } : {}),
			...(typeof item.proxied === 'boolean' ? { proxied: item.proxied } : {}),
			...(item.comment ? { comment: item.comment } : {}),
			...(item.tags?.length ? { tags: item.tags } : {}),
		}));
		return {
			name: normalizeDnsName(first.name),
			type: first.type.toUpperCase(),
			ttl: first.ttl,
			values: entries.map((entry) => entry.value),
			metadata: {
				records: entries,
				...(entries.some((entry) => entry.unparsed) ? { unparsedValues: entries.filter((entry) => entry.unparsed).map((entry) => entry.value) } : {}),
				...(first.ttl === 1 ? { autoTtl: true } : {}),
				...(proxied.length === items.length && proxied.every((value) => value === proxied[0]) ? { proxied: proxied[0] } : {}),
			},
		};
	});
}

export interface CloudflareDnsServiceInit {
	readOnly: boolean;
	options: CloudflareDnsServiceOptions;
	/** Called lazily on the first operation; resolves credentials. */
	createClient(): CloudflareClient;
}

/**
 * Portable `IDnsService` over Cloudflare. RRSets are derived from per-record data;
 * `setRecord`/`deleteRecord` send one `dns_records/batch` request, which Cloudflare applies
 * in a single transaction (all-or-nothing), though edge propagation is eventually consistent.
 */
export function createCloudflareDnsService(init: CloudflareDnsServiceInit): IDnsService {
	const { readOnly, options } = init;
	const scope = new DnsOperationScope(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
	let client: CloudflareClient | undefined;
	const getClient = () => (client ??= init.createClient());
	const writable = () => {
		if (readOnly) throw new Error('Selected service is read-only');
	};
	const req = (signal: AbortSignal): CloudflareRequestOptions => ({ signal });
	const maxBatchChanges = options.maxBatchChanges ?? DEFAULT_MAX_BATCH_CHANGES;
	/** Splitting would lose atomicity, so an oversized change is refused instead. */
	const checkBatchSize = (changes: number) => {
		if (changes > maxBatchChanges)
			throw new Error(`Cloudflare DNS change needs ${changes} record changes, above the batch limit of ${maxBatchChanges} (maxBatchChanges); it was not applied`);
	};

	async function zoneOf(zone: string, signal: AbortSignal): Promise<CloudflareZone> {
		const name = normalizeDnsName(zone);
		if (name === '.') throw new TypeError('Cloudflare does not host the root zone');
		const { result } = await getClient().listZone({ name: bare(name), perPage: 5 }, req(signal));
		const found = result.find((item) => sameDnsName(normalizeDnsName(item.name), name));
		if (!found) throw new Error('DNS zone not found');
		return found;
	}

	async function recordsOf(zoneId: string, filter: { name?: string; type?: string }, signal: AbortSignal): Promise<CloudflareDnsRecord[]> {
		const all: CloudflareDnsRecord[] = [];
		for (let page = 1; page <= MAX_PAGES; page++) {
			const { result, resultInfo } = await getClient().listDnsRecord({ zoneId, ...filter, page, perPage: RECORD_PAGE_SIZE }, req(signal));
			all.push(...result);
			const totalPages = resultInfo?.total_pages ?? (result.length < RECORD_PAGE_SIZE ? page : page + 1);
			if (page >= totalPages || !result.length) break;
		}
		return all;
	}

	const service: IDnsService = {
		type: 'dns',
		provider: 'cloudflare',
		readOnly,
		async listZone(input, callOptions) {
			return scope.run(callOptions, async (signal) => {
				const name = input?.name === undefined ? undefined : bare(normalizeDnsName(input.name));
				if (input?.limit !== undefined) {
					const perPage = Math.min(input.limit, ZONE_PAGE_SIZE);
					const { page } = parsePageCursor(input.cursor, perPage);
					const { result, resultInfo } = await getClient().listZone({ name, page, perPage }, req(signal));
					const more = resultInfo?.total_pages !== undefined && page < resultInfo.total_pages;
					return { zones: result.map(toCloudflareDnsZone), ...(more ? { nextCursor: formatPageCursor(page + 1, perPage) } : {}) };
				}
				const zones: DnsZone[] = [];
				const start = parsePageCursor(input?.cursor);
				const perPage = start.size ?? ZONE_PAGE_SIZE;
				for (let page = start.page; page <= MAX_PAGES; page++) {
					const { result, resultInfo } = await getClient().listZone({ name, page, perPage }, req(signal));
					zones.push(...result.map(toCloudflareDnsZone));
					if (!result.length || page >= (resultInfo?.total_pages ?? page)) break;
				}
				return { zones };
			});
		},
		async getZone(input, callOptions) {
			return scope.run(callOptions, async (signal) => {
				const found = await zoneOf(input.zone, signal);
				return toCloudflareDnsZone(await getClient().getZone({ zoneId: found.id }, req(signal)));
			});
		},
		async createZone({ dryRun, zone, kind, nameservers }, callOptions) {
			if (dryRun !== true) writable();
			return scope.run(callOptions, async (signal) => {
				if (nameservers?.length) throw new TypeError('Cloudflare assigns nameservers; nameservers is not supported');
				const name = normalizeDnsName(zone);
				if (name === '.') throw new TypeError('Cloudflare does not host the root zone');
				if (!options.accountId) throw new Error('Cloudflare createZone requires the accountId service option');
				const input = { name: bare(name), accountId: options.accountId, ...(kind ? { type: kind } : {}) };
				// The preview is built locally: no credentials are resolved and nothing is sent.
				if (dryRun === true) return { ok: true as const, dryRun: true, zone: { id: name, name }, request: prepareCloudflareCreateZone(input) };
				return { ok: true as const, zone: toCloudflareDnsZone(await getClient().createZone(input, req(signal))) };
			});
		},
		async deleteZone({ dryRun, zone }, callOptions) {
			if (dryRun !== true) writable();
			return scope.run(callOptions, async (signal) => {
				const found = await zoneOf(zone, signal);
				const request = getClient().prepareDeleteZone({ zoneId: found.id });
				if (dryRun === true) return { ok: true as const, dryRun: true, zone: toCloudflareDnsZone(found), request };
				await getClient().deleteZone({ zoneId: found.id }, req(signal));
				return { ok: true as const };
			});
		},
		async listRecord({ zone, name, type, cursor, limit }, callOptions) {
			return scope.run(callOptions, async (signal) => {
				const found = await zoneOf(zone, signal);
				const owner = name === undefined ? undefined : normalizeDnsRecordName(name, found.name);
				const kind = type?.toUpperCase();
				const records = await recordsOf(found.id, { ...(owner ? { name: bare(owner) } : {}), ...(kind ? { type: kind } : {}) }, signal);
				const rrsets = groupCloudflareRecords(records).filter(
					(rrset) => (owner === undefined || sameDnsName(rrset.name, owner)) && (kind === undefined || rrset.type === kind),
				);
				const { items, nextCursor } = pageLocally(rrsets, { cursor, limit });
				return { rrsets: items, ...(nextCursor ? { nextCursor } : {}) };
			});
		},
		/** Diff against current records, then one atomic batch: deletes, patches (in-place updates), posts. */
		async setRecord({ dryRun, zone, name, type, ttl, values }, callOptions) {
			if (dryRun !== true) writable();
			return scope.run(callOptions, async (signal) => {
				const kind = type.toUpperCase();
				// Validate and normalize the desired values before any request.
				const inputs = values.map((value) => cloudflareRecordInput(kind, value));
				const desired = inputs.map((input) => cloudflareRecordValue({ id: '', name: '', type: kind, ttl, ...input } as CloudflareDnsRecord));
				const found = await zoneOf(zone, signal);
				const owner = normalizeDnsRecordName(name, normalizeDnsName(found.name));
				const existing = (await recordsOf(found.id, { name: bare(owner), type: kind }, signal)).filter(
					(record) => sameDnsName(normalizeDnsName(record.name), owner) && record.type.toUpperCase() === kind,
				);
				const plan = planDnsRecordChanges({
					type: kind,
					ttl,
					values: desired,
					// Cloudflare forces TTL 1 (auto) on proxied records; their TTL is not compared.
					existing: existing.map((record) => ({ record, value: readCloudflareRecordValue(record).value, ttl: record.proxied === true ? ttl : record.ttl })),
				});
				const proxiedValues = existing.map((record) => record.proxied).filter((value): value is boolean => typeof value === 'boolean');
				const inherit: { proxied?: true } = PROXIABLE.has(kind) && proxiedValues.length > 0 && proxiedValues.every(Boolean) ? { proxied: true } : {};
				// Proxied records always carry TTL 1 (auto); the requested TTL applies to DNS-only records.
				const body = (value: string, proxied: boolean): CloudflareDnsRecordInput => ({ name: bare(owner), type: kind, ttl: proxied ? 1 : ttl, ...cloudflareRecordInput(kind, value) });
				const batch = {
					zoneId: found.id,
					deletes: plan.delete.map((record) => ({ id: record.id })),
					patches: plan.update.map(({ record, value }) => ({ id: record.id, ...body(value, record.proxied === true) })),
					posts: plan.create.map((value) => ({ ...body(value, inherit.proxied === true), ...inherit })),
				};
				checkBatchSize(batch.deletes.length + batch.patches.length + batch.posts.length);
				const request = {
					...getClient().prepareBatchDnsRecord(batch),
					summary: { unchanged: plan.keep.length, update: plan.update.length, create: plan.create.length, delete: plan.delete.length },
				};
				const rrset = { name: owner, type: kind, ttl, values: desired };
				if (dryRun === true) return { ok: true as const, dryRun: true, rrset, request };
				if (plan.update.length || plan.create.length || plan.delete.length) await getClient().batchDnsRecord(batch, req(signal));
				return { ok: true as const, rrset, request };
			});
		},
		async deleteRecord({ dryRun, zone, name, type }, callOptions) {
			if (dryRun !== true) writable();
			return scope.run(callOptions, async (signal) => {
				const kind = type.toUpperCase();
				const found = await zoneOf(zone, signal);
				const owner = normalizeDnsRecordName(name, normalizeDnsName(found.name));
				const existing = (await recordsOf(found.id, { name: bare(owner), type: kind }, signal)).filter(
					(record) => sameDnsName(normalizeDnsName(record.name), owner) && record.type.toUpperCase() === kind,
				);
				const batch = { zoneId: found.id, deletes: existing.map((record) => ({ id: record.id })) };
				checkBatchSize(batch.deletes.length);
				const request = getClient().prepareBatchDnsRecord(batch);
				if (dryRun === true) return { ok: true as const, dryRun: true, request };
				if (batch.deletes.length) await getClient().batchDnsRecord(batch, req(signal));
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

/** Parses options at instance creation; the token is read on the first operation. */
export function createCloudflareDnsServiceFromContext({ config, getEnv, fetch }: ServiceProviderContext): IDnsService {
	const parsed = CloudflareDnsServiceOptionsSchema.safeParse(config.options ?? {});
	if (!parsed.success) throw new Error('Invalid Cloudflare service configuration');
	const options = parsed.data;
	if (options.apiToken !== undefined && options.apiTokenEnv !== undefined) throw new Error('Conflicting Cloudflare credential configuration');
	if (options.apiToken === undefined && options.apiTokenEnv === undefined) throw new Error('Cloudflare service requires apiToken or apiTokenEnv');
	return createCloudflareDnsService({
		readOnly: config.readOnly !== false,
		options,
		createClient() {
			let apiToken = options.apiToken;
			if (options.apiTokenEnv !== undefined) {
				apiToken = getEnv?.(options.apiTokenEnv);
				if (!apiToken) throw new Error('Cloudflare credential environment variable is unavailable');
			}
			return new CloudflareClient({ apiToken: apiToken!, baseUrl: config.baseUrl, fetch, timeoutMs: 0 });
		},
	});
}

export const CloudflareDnsServiceProvider: ServiceProviderDefinition<IDnsService> = {
	name: 'cloudflare',
	title: 'Cloudflare DNS',
	description: 'Cloudflare DNS zones and records as portable RRSets; record writes use one atomic batch request.',
	examples: [
		{ command: 'woctl dns zone list --service cf', description: 'List zones.' },
		{ command: 'woctl dns record set example.com www A 192.0.2.1 --dry-run', description: 'Preview an RRSet change.' },
	],
	aliases: ['cf'],
	provides: [DnsServiceCapability],
	optionsSchema: CloudflareDnsServiceOptionsSchema,
	operations: DnsOperations,
	create(context) {
		return { dns: createCloudflareDnsServiceFromContext(context) };
	},
};
