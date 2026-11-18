import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';
import { isValidDnsName } from './name';

const dns = oc.$meta<ServiceToolMeta>({});
const readTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
const createTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: false, supportsDryRun: true };
const destructiveTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true, supportsDryRun: true };
const json = { type: ['object', 'array', 'string', 'number', 'boolean', 'null'] };

const dnsName = z.string().trim().min(1).max(1024).refine(isValidDnsName, { message: 'Invalid DNS name' });
const zone = dnsName.describe('Zone name; a trailing dot is added when missing. "." is the root zone.');
const recordName = z.string().trim().min(1).max(1024)
	.refine((value) => value === '@' || isValidDnsName(value), { message: 'Invalid DNS name' })
	.describe('Record name; @ is the apex and relative names resolve below the zone.');
const recordType = z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9-]+$/u, { message: 'Invalid record type' })
	.describe('Record type, for example A, AAAA, CNAME or TXT.');
/**
 * Portable RRSet value format: RFC 1035 presentation (zone-file RDATA) form. Examples:
 * TXT `"v=spf1 -all"` (quoted, multiple strings `"a" "b"`, `\"` escapes), MX `10 mx.example.com.`,
 * CNAME/NS/PTR targets absolute with a trailing dot. Providers convert to and from their API format.
 */
export const RRSetValuesDescription =
	'RDATA in RFC 1035 presentation (zone-file) format: TXT quoted ("a" "b"), MX "10 mx.example.com.", CNAME/NS targets absolute with a trailing dot. Only enabled records.';
const dryRun = z.boolean().optional().describe('Preview the change without applying it.');
/** Supplier-specific fields; never required by portable callers. */
const metadata = z.record(z.string(), z.unknown().meta(json)).optional();

export const DnsZoneSchema = z.object({
	id: z.string(),
	name: z.string().describe('Canonical zone name with a trailing dot.'),
	kind: z.string().optional(),
	serial: z.number().optional(),
	metadata,
});
export const DnsRRSetSchema = z.object({
	name: z.string().describe('Canonical owner name with a trailing dot.'),
	type: z.string(),
	ttl: z.number().int().nonnegative(),
	values: z.array(z.string()).describe(RRSetValuesDescription),
	metadata: metadata.describe('Supplier-specific fields, for example disabledValues or comments.'),
});
/** Result of a mutation, or a dry-run preview; `request` is a supplier-specific plan. */
export const DnsWriteResultSchema = z.object({
	ok: z.literal(true),
	dryRun: z.boolean().optional(),
	zone: DnsZoneSchema.optional(),
	rrset: DnsRRSetSchema.optional(),
	request: z.unknown().optional().meta(json),
});

const cursor = z.string().min(1).max(4096).optional().describe('Opaque cursor from a previous nextCursor.');
const limit = z.number().int().min(1).max(10_000).optional().describe('Maximum items per page; providers may return fewer.');
const nextCursor = z.string().optional().describe('Present when more items are available; absent on the last page.');
export const DnsListZoneInputSchema = z.strictObject({ name: zone.optional().describe('Only return this zone.'), cursor, limit }).default({});
export const DnsListZoneOutputSchema = z.object({ zones: z.array(DnsZoneSchema), nextCursor });
export const DnsZoneInputSchema = z.strictObject({ zone });
export const DnsCreateZoneInputSchema = z.strictObject({
	zone,
	kind: z.string().trim().min(1).max(64).optional().describe('Supplier zone kind, for example Native for PowerDNS.'),
	nameservers: z.array(dnsName).optional(),
	dryRun,
});
export const DnsDeleteZoneInputSchema = z.strictObject({ zone, dryRun });
export const DnsListRecordInputSchema = z.strictObject({ zone, name: recordName.optional(), type: recordType.optional(), cursor, limit });
export const DnsListRecordOutputSchema = z.object({ rrsets: z.array(DnsRRSetSchema), nextCursor });
export const DnsSetRecordInputSchema = z.strictObject({
	zone, name: recordName, type: recordType,
	ttl: z.number().int().min(0).max(2_147_483_647),
	values: z.array(z.string().min(1).max(65_535)).min(1).describe(`${RRSetValuesDescription} All given values are enabled; records not listed (including disabled ones) are removed.`),
	dryRun,
});
export const DnsDeleteRecordInputSchema = z.strictObject({ zone, name: recordName, type: recordType, dryRun });

/** Portable DNS operations shared by every DNS provider. */
export const DnsServiceContract = {
	listZone: dns.input(DnsListZoneInputSchema).output(DnsListZoneOutputSchema).meta({ ...readTool, description: 'List DNS zones.' }),
	getZone: dns.input(DnsZoneInputSchema).output(DnsZoneSchema).meta({ ...readTool, description: 'Read one DNS zone.' }),
	createZone: dns.input(DnsCreateZoneInputSchema).output(DnsWriteResultSchema).meta({ ...createTool, description: 'Create a DNS zone. dryRun previews the request.' }),
	deleteZone: dns.input(DnsDeleteZoneInputSchema).output(DnsWriteResultSchema).meta({ ...destructiveTool, description: 'Delete a DNS zone and all its records. dryRun previews the request.' }),
	listRecord: dns.input(DnsListRecordInputSchema).output(DnsListRecordOutputSchema).meta({ ...readTool, description: 'List RRSets of a zone, optionally filtered by name and type.' }),
	setRecord: dns.input(DnsSetRecordInputSchema).output(DnsWriteResultSchema).meta({ ...destructiveTool, description: 'Replace the whole RRSet identified by name and type with the given enabled values (presentation format); other records, including disabled ones, are removed. dryRun previews the request.' }),
	deleteRecord: dns.input(DnsDeleteRecordInputSchema).output(DnsWriteResultSchema).meta({ ...destructiveTool, description: 'Delete the RRSet identified by name and type. dryRun previews the request.' }),
};

export type DnsServiceInputs = InferContractRouterInputs<typeof DnsServiceContract>;
export type DnsServiceOutputs = InferContractRouterOutputs<typeof DnsServiceContract>;
export type DnsZone = z.output<typeof DnsZoneSchema>;
export type DnsRRSet = z.output<typeof DnsRRSetSchema>;
export type DnsWriteResult = z.output<typeof DnsWriteResultSchema>;
export type DnsServiceClientContext = { timeoutMs?: number };
export type IDnsServiceContract = ContractRouterClient<typeof DnsServiceContract, DnsServiceClientContext>;
export type DnsServiceCallOptions = NonNullable<Parameters<IDnsServiceContract['getZone']>[1]>;

/** Derived from contract metadata so new mutation tools cannot silently escape the guard. */
export const DnsWriteOperations: ReadonlySet<string> = new Set(
	Object.entries(DnsServiceContract).filter(([, procedure]) => procedure['~orpc'].meta.readOnlyHint !== true).map(([key]) => key),
);
