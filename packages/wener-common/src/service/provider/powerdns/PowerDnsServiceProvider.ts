import { normalizePowerDnsRecordName, normalizePowerDnsZone, type PowerDnsClient, powerDnsZoneId } from '@wener/client/powerdns';
import type { DnsRRSet, DnsZone } from '../../dns/DnsServiceContract';
import { DnsServiceCapability, type IDnsService } from '../../dns/IDnsService';
import { sameDnsName } from '../../dns/name';
import { DnsOperations } from '../../dns/operations';
import type { ServiceProviderDefinition } from '../../registry';
import {
	createPowerDnsClientFromContext,
	createPowerDnsExtensionService,
	type IPowerDnsService,
	PowerDnsOperations,
	PowerDnsServiceCapability,
	PowerDnsServiceOptionsSchema,
	powerDnsRequestOptions as o,
} from '../../powerdns';

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Portable fields are lifted out; everything else stays in `metadata`. */
export function toDnsZone(value: Record<string, unknown>): DnsZone {
	const { id, name, kind, serial, rrsets: _rrsets, ...rest } = value;
	const zoneName = typeof name === 'string' ? name : typeof id === 'string' ? id : '';
	return {
		id: typeof id === 'string' ? id : powerDnsZoneId(zoneName),
		name: zoneName,
		...(typeof kind === 'string' ? { kind } : {}),
		...(typeof serial === 'number' ? { serial } : {}),
		...(Object.keys(rest).length ? { metadata: rest } : {}),
	};
}

export function toDnsRRSet(value: Record<string, unknown>): DnsRRSet {
	const records = Array.isArray(value.records) ? value.records.filter(isRecord) : [];
	const disabledValues = records.filter((record) => record.disabled === true).map((record) => String(record.content ?? ''));
	const comments = Array.isArray(value.comments) && value.comments.length ? value.comments : undefined;
	const metadata = { ...(disabledValues.length ? { disabledValues } : {}), ...(comments ? { comments } : {}) };
	return {
		name: String(value.name ?? ''),
		type: String(value.type ?? ''),
		ttl: typeof value.ttl === 'number' && value.ttl >= 0 ? value.ttl : 0,
		// PowerDNS content is already RFC 1035 presentation format; pass through unchanged.
		values: records.filter((record) => record.disabled !== true).map((record) => String(record.content ?? '')),
		...(Object.keys(metadata).length ? { metadata } : {}),
	};
}

/**
 * PowerDNS returns complete lists. Pagination is applied locally only when `limit` is given;
 * the cursor is an opaque offset issued by this provider.
 */
function page<T>(items: T[], input: { cursor?: string; limit?: number } | undefined): { items: T[]; nextCursor?: string } {
	let offset = 0;
	if (input?.cursor !== undefined) {
		const match = /^o:(\d{1,9})$/u.exec(input.cursor);
		if (!match) throw new TypeError('Invalid DNS cursor');
		offset = Number(match[1]);
	}
	if (input?.limit === undefined) return { items: items.slice(offset) };
	const end = offset + input.limit;
	return { items: items.slice(offset, end), ...(end < items.length ? { nextCursor: `o:${end}` } : {}) };
}

/** Portable `IDnsService` backed by PowerDNS; dot-segment and root-zone handling comes from the client. */
export function createPowerDnsDnsService(client: PowerDnsClient, readOnly: boolean, close: () => Promise<void> = () => client.close()): IDnsService {
	const writable = () => {
		if (readOnly) throw new Error('Selected service is read-only');
	};
	const zonePath = (zone: string) => `/servers/${encodeURIComponent(client.server)}/zones/${encodeURIComponent(powerDnsZoneId(zone))}`;
	const service: IDnsService = {
		type: 'dns',
		provider: 'powerdns',
		readOnly,
		async listZone(input, options) {
			const zones = await client.listZone(input?.name === undefined ? {} : { zone: input.name }, o(options));
			const { items, nextCursor } = page(zones.map(toDnsZone), input);
			return { zones: items, ...(nextCursor ? { nextCursor } : {}) };
		},
		async getZone(input, options) {
			return toDnsZone(await client.getZone({ zone: input.zone, rrsets: false }, o(options)));
		},
		async createZone({ dryRun, zone, kind, nameservers }, options) {
			const input = { zone, kind: kind as 'Native' | undefined, nameservers };
			const request = client.prepareCreateZone(input);
			const name = normalizePowerDnsZone(zone);
			if (dryRun === true) return { ok: true, dryRun: true, zone: { id: powerDnsZoneId(name), name }, request };
			writable();
			return { ok: true, zone: toDnsZone(await client.createZone(input, o(options))) };
		},
		async deleteZone({ dryRun, zone }, options) {
			const name = normalizePowerDnsZone(zone);
			if (dryRun === true) return { ok: true, dryRun: true, zone: { id: powerDnsZoneId(name), name }, request: { method: 'DELETE', path: zonePath(name) } };
			writable();
			await client.deleteZone({ zone }, o(options));
			return { ok: true };
		},
		async listRecord({ zone, name, type, cursor, limit }, options) {
			const owner = name === undefined ? undefined : normalizePowerDnsRecordName(name, zone);
			const kind = type?.toUpperCase();
			const value = await client.getZone({ zone, rrsets: true, ...(owner ? { rrsetName: owner, ...(kind ? { rrsetType: kind } : {}) } : {}) }, o(options));
			const rrsets = Array.isArray(value.rrsets) ? value.rrsets.filter(isRecord) : [];
			const matched = rrsets
				.map(toDnsRRSet)
				.filter((rrset) => (owner === undefined || sameDnsName(rrset.name, owner)) && (kind === undefined || rrset.type.toUpperCase() === kind));
			const { items, nextCursor } = page(matched, { cursor, limit });
			return { rrsets: items, ...(nextCursor ? { nextCursor } : {}) };
		},
		/** Replaces the RRSet with the given values, all enabled; disabled records are not preserved. */
		async setRecord({ dryRun, zone, name, type, ttl, values }, options) {
			const input = { zone, name, type, ttl, records: values.map((content) => ({ content })) };
			const request = client.prepareReplaceRrset(input);
			const rrset = { name: normalizePowerDnsRecordName(name, zone), type: type.toUpperCase(), ttl, values };
			if (dryRun === true) return { ok: true, dryRun: true, rrset, request };
			writable();
			await client.replaceRrset(input, o(options));
			return { ok: true, rrset };
		},
		async deleteRecord({ dryRun, zone, name, type }, options) {
			const request = client.prepareDeleteRrset({ zone, name, type });
			if (dryRun === true) return { ok: true, dryRun: true, request };
			writable();
			await client.deleteRrset({ zone, name, type }, o(options));
			return { ok: true };
		},
		close,
		[Symbol.asyncDispose]() {
			return this.close();
		},
	};
	return service;
}

/**
 * One configured PowerDNS service provides both the portable `dns` capability and the
 * PowerDNS-only `powerdns` extension over a single HTTP client.
 */
export const PowerDnsServiceProvider: ServiceProviderDefinition<IDnsService | IPowerDnsService> = {
	name: 'powerdns',
	title: 'PowerDNS',
	description: 'PowerDNS Authoritative HTTP API: portable DNS zones and RRSets plus servers, metadata, DNSSEC cryptokeys and TSIG keys.',
	examples: [
		{ command: 'woctl dns zone list', description: 'List zones.' },
		{ command: 'woctl dns record list example.com', description: 'List RRSets of a zone.' },
	],
	aliases: ['pdns'],
	provides: [DnsServiceCapability, PowerDnsServiceCapability],
	optionsSchema: PowerDnsServiceOptionsSchema,
	operations: { ...DnsOperations, ...PowerDnsOperations },
	create(context) {
		const client = createPowerDnsClientFromContext(context);
		const readOnly = context.config.readOnly !== false;
		const close = () => client.close();
		return {
			dns: createPowerDnsDnsService(client, readOnly, close),
			powerdns: createPowerDnsExtensionService(client, readOnly, close),
		};
	},
};
