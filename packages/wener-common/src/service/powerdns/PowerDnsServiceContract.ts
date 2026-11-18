import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { isSafePowerDnsPath, type PowerDnsRequestOptions } from '@wener/client/powerdns';
import { z } from 'zod';
import { isValidDnsName } from '../dns/name';
import type { ServiceToolMeta } from '../runtime/contract';

const powerdns = oc.$meta<ServiceToolMeta>({});
const readTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
const writeTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: false };
const destructiveTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };

const notDotSegment = (value: string) => value !== '.' && value !== '..' && !value.includes('/');
const segmentMessage = { message: 'Must not be ".", ".." or contain "/"' };
const name = z.string().trim().min(1).max(1024);
const segment = (max: number) => z.string().trim().min(1).max(max).refine(notDotSegment, segmentMessage);
const server = segment(512).optional().describe('Server id; defaults to the configured server (usually localhost).');
const zone = name.refine(isValidDnsName, { message: 'Invalid DNS name' }).describe('Zone name; a trailing dot is added when missing. "." is the root zone.');
const json = { type: ['object', 'array', 'string', 'number', 'boolean', 'null'] };
const resource = z.looseObject({});
const resourceList = z.array(resource);

export const PowerDnsServerInputSchema = z.strictObject({ server }).default({});
export const PowerDnsListServerInputSchema = z.strictObject({}).default({});
export const PowerDnsSearchDataInputSchema = z.strictObject({
	server,
	query: z.string().trim().min(1).max(1024).describe('Search term; * and ? are wildcards.'),
	max: z.number().int().min(1).max(10_000).optional(),
	objectType: z.enum(['all', 'zone', 'record', 'comment']).optional(),
});
export const PowerDnsZoneInputSchema = z.strictObject({ server, zone });
export const PowerDnsCreateZoneInputSchema = z.strictObject({
	server, zone,
	kind: z.enum(['Native', 'Master', 'Slave', 'Producer', 'Consumer']).optional().describe('PowerDNS zone kind (default Native).'),
	masters: z.array(z.string().trim().min(1).max(256)).optional().describe('Primary server addresses for Slave/Consumer zones, e.g. 192.0.2.53 or 192.0.2.53:5300.'),
	nameservers: z.array(name.refine(isValidDnsName, { message: 'Invalid DNS name' })).optional(),
	account: z.string().max(1024).optional(),
	dnssec: z.boolean().optional().describe('Sign the zone on creation.'),
	dryRun: z.boolean().optional(),
}).refine((input) => !input.masters?.length || input.kind === 'Slave' || input.kind === 'Consumer', { message: 'masters requires kind Slave or Consumer' });
const kind = segment(256);
export const PowerDnsMetadataInputSchema = z.strictObject({ server, zone, kind });
export const PowerDnsSetMetadataInputSchema = z.strictObject({ server, zone, kind, values: z.array(z.string()) });
const keyId = z.number().int().nonnegative();
export const PowerDnsCryptokeyInputSchema = z.strictObject({ server, zone, id: keyId });
export const PowerDnsCreateCryptokeyInputSchema = z.strictObject({
	server, zone,
	keytype: z.enum(['ksk', 'zsk', 'csk']).optional(),
	algorithm: z.string().trim().min(1).max(64).optional(),
	bits: z.number().int().positive().optional(),
	active: z.boolean().optional(),
	published: z.boolean().optional(),
});
export const PowerDnsUpdateCryptokeyInputSchema = z.strictObject({
	server, zone, id: keyId, active: z.boolean().optional(), published: z.boolean().optional(),
}).refine((input) => input.active !== undefined || input.published !== undefined, { message: 'active or published is required' });
export const PowerDnsTsigKeyInputSchema = z.strictObject({ server, id: segment(1024) });
export const PowerDnsCreateTsigKeyInputSchema = z.strictObject({
	server, name,
	algorithm: z.string().trim().min(1).max(64).optional(),
	key: z.string().min(1).max(4096).optional().describe('Base64 secret; PowerDNS generates one when omitted.'),
});
export const PowerDnsUpdateTsigKeyInputSchema = z.strictObject({
	server, id: segment(1024), name: name.optional(),
	algorithm: z.string().trim().min(1).max(64).optional(),
	key: z.string().min(1).max(4096).optional(),
}).refine((input) => input.name !== undefined || input.algorithm !== undefined || input.key !== undefined, { message: 'name, algorithm or key is required' });

const queryValue = z.union([z.string(), z.number(), z.boolean()]);
export const PowerDnsRequestInputSchema = z.strictObject({
	path: z.string().min(1).max(2048).refine(
		(value) => isSafePowerDnsPath(value.replace(/^\/api\/v1(?=\/|$)/u, '') || '/'),
		{ message: 'Invalid PowerDNS API path' },
	).describe('Path relative to /api/v1, for example /servers/localhost/zones.'),
	method: z.enum(['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
	query: z.record(z.string(), z.union([queryValue, z.array(queryValue)])).optional(),
	body: z.unknown().optional().meta(json),
});
export const PowerDnsRequestOutputSchema = z.unknown();

export const PowerDnsServerSchema = z.looseObject({ id: z.string().optional(), daemon_type: z.string().optional(), version: z.string().optional(), url: z.string().optional() });
export const PowerDnsZoneSchema = z.looseObject({ id: z.string().optional(), name: z.string().optional(), kind: z.string().optional() });
export const PowerDnsMetadataSchema = z.looseObject({ kind: z.string().optional(), metadata: z.array(z.string()).optional() });
export const PowerDnsCryptokeySchema = z.looseObject({ id: z.number().optional(), keytype: z.string().optional(), active: z.boolean().optional() });
export const PowerDnsTsigKeySchema = z.looseObject({ id: z.string().optional(), name: z.string().optional(), algorithm: z.string().optional(), key: z.string().optional() });
/** Result of a mutation without a stable response body, or a local dry-run preview of the HTTP request. */
export const PowerDnsWriteResultSchema = z.looseObject({
	ok: z.literal(true),
	dryRun: z.boolean().optional(),
	request: z.looseObject({ method: z.string(), path: z.string(), body: z.unknown().optional().meta(json) }).optional(),
	result: z.unknown().optional().meta(json),
});

/**
 * PowerDNS-only extension operations. Portable zone/RRSet operations live in `DnsServiceContract`;
 * tool names here must not collide with it because one provider registers both.
 */
export const PowerDnsServiceContract = {
	listServer: powerdns.input(PowerDnsListServerInputSchema).output(z.array(PowerDnsServerSchema)).meta({ ...readTool, description: 'List PowerDNS servers.' }),
	getServer: powerdns.input(PowerDnsServerInputSchema).output(PowerDnsServerSchema).meta({ ...readTool, description: 'Read one PowerDNS server.' }),
	listServerStatistic: powerdns.input(PowerDnsServerInputSchema).output(resourceList).meta({ ...readTool, description: 'Read server statistics.' }),
	searchData: powerdns.input(PowerDnsSearchDataInputSchema).output(resourceList).meta({ ...readTool, description: 'Search zones, records and comments.' }),
	createPowerDnsZone: powerdns.input(PowerDnsCreateZoneInputSchema).output(z.union([PowerDnsWriteResultSchema, PowerDnsZoneSchema])).meta({ ...writeTool, supportsDryRun: true, description: 'Create a zone with PowerDNS-specific fields (kind, masters, account, dnssec). dryRun previews the request locally.' }),
	notifyZone: powerdns.input(PowerDnsZoneInputSchema).output(PowerDnsWriteResultSchema).meta({ ...writeTool, description: 'Send DNS NOTIFY to the zone secondaries.' }),
	retrieveZoneAxfr: powerdns.input(PowerDnsZoneInputSchema).output(PowerDnsWriteResultSchema).meta({ ...writeTool, description: 'Retrieve a secondary zone from its primary via AXFR.' }),
	listMetadata: powerdns.input(PowerDnsZoneInputSchema).output(z.array(PowerDnsMetadataSchema)).meta({ ...readTool, description: 'List zone metadata.' }),
	getMetadata: powerdns.input(PowerDnsMetadataInputSchema).output(PowerDnsMetadataSchema).meta({ ...readTool, description: 'Read one zone metadata kind.' }),
	setMetadata: powerdns.input(PowerDnsSetMetadataInputSchema).output(PowerDnsMetadataSchema).meta({ ...destructiveTool, description: 'Replace all values of one zone metadata kind.' }),
	deleteMetadata: powerdns.input(PowerDnsMetadataInputSchema).output(PowerDnsWriteResultSchema).meta({ ...destructiveTool, description: 'Delete one zone metadata kind.' }),
	listCryptokey: powerdns.input(PowerDnsZoneInputSchema).output(z.array(PowerDnsCryptokeySchema)).meta({ ...readTool, description: 'List DNSSEC cryptokeys of a zone.' }),
	getCryptokey: powerdns.input(PowerDnsCryptokeyInputSchema).output(PowerDnsCryptokeySchema).meta({ ...readTool, description: 'Read one DNSSEC cryptokey.' }),
	createCryptokey: powerdns.input(PowerDnsCreateCryptokeyInputSchema).output(PowerDnsCryptokeySchema).meta({ ...writeTool, description: 'Create or import a DNSSEC cryptokey.' }),
	updateCryptokey: powerdns.input(PowerDnsUpdateCryptokeyInputSchema).output(PowerDnsWriteResultSchema).meta({ ...destructiveTool, description: 'Activate, deactivate, publish or unpublish a DNSSEC cryptokey.' }),
	deleteCryptokey: powerdns.input(PowerDnsCryptokeyInputSchema).output(PowerDnsWriteResultSchema).meta({ ...destructiveTool, description: 'Delete a DNSSEC cryptokey.' }),
	listTsigKey: powerdns.input(PowerDnsServerInputSchema).output(z.array(PowerDnsTsigKeySchema)).meta({ ...readTool, description: 'List TSIG keys without secrets.' }),
	getTsigKey: powerdns.input(PowerDnsTsigKeyInputSchema).output(PowerDnsTsigKeySchema).meta({ ...readTool, description: 'Read one TSIG key including its secret.' }),
	createTsigKey: powerdns.input(PowerDnsCreateTsigKeyInputSchema).output(PowerDnsTsigKeySchema).meta({ ...writeTool, description: 'Create a TSIG key; the response contains the secret.' }),
	updateTsigKey: powerdns.input(PowerDnsUpdateTsigKeyInputSchema).output(PowerDnsTsigKeySchema).meta({ ...destructiveTool, description: 'Rename a TSIG key or replace its algorithm or secret.' }),
	deleteTsigKey: powerdns.input(PowerDnsTsigKeyInputSchema).output(PowerDnsWriteResultSchema).meta({ ...destructiveTool, description: 'Delete a TSIG key.' }),
	request: powerdns.input(PowerDnsRequestInputSchema).output(PowerDnsRequestOutputSchema).meta({ ...destructiveTool, description: 'Call a PowerDNS API path relative to /api/v1. Non-read methods or a body require a writable service.' }),
};

export type PowerDnsServiceInputs = InferContractRouterInputs<typeof PowerDnsServiceContract>;
export type PowerDnsServiceOutputs = InferContractRouterOutputs<typeof PowerDnsServiceContract>;
/** Per-call transport settings use oRPC's client context; cancellation uses options.signal. */
export type PowerDnsServiceClientContext = Pick<PowerDnsRequestOptions, 'timeoutMs'>;
export type IPowerDnsServiceContract = ContractRouterClient<typeof PowerDnsServiceContract, PowerDnsServiceClientContext>;
export type PowerDnsServiceCallOptions = NonNullable<Parameters<IPowerDnsServiceContract['getServer']>[1]>;

/** Derived from contract metadata so new mutation tools cannot silently escape the guard. */
export const PowerDnsWriteOperations: ReadonlySet<string> = new Set(
	Object.entries(PowerDnsServiceContract).filter(([, procedure]) => procedure['~orpc'].meta.readOnlyHint !== true).map(([key]) => key),
);
