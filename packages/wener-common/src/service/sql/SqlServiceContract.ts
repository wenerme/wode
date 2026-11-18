import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { z } from 'zod';
import { toJsonSchema } from '../../schema';
import type { ServiceContract } from '../runtime/types';
import type { ServiceToolMeta } from '../runtime/contract';

const page = {
	limit: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
	offset: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
};
const objectReference = z.strictObject({
	name: z.string().min(1).optional(),
	schema: z.string().optional(),
	catalog: z.string().optional(),
	type: z.string().optional(),
});
const statement = { statement: z.string().regex(/\S/), params: z.array(z.unknown()).readonly().optional() };

/** Shared transport inputs; validation and SQL read-only policy remain in the service core. */
export const SqlMethodInputs = {
	ping: z.strictObject({}).default({}),
	query: z.strictObject({ ...statement, ...page }),
	exec: z.strictObject(statement),
	listObject: z.strictObject({ parent: objectReference.optional(), search: z.string().optional(), ...page }).default({}),
	describeObject: z.strictObject({ object: objectReference.extend({ name: z.string().min(1) }) }),
};

const attributes = z.record(z.string(), z.unknown());
const objectOutput = z.object({
	catalog: z.string().optional(),
	schema: z.string().optional(),
	name: z.string(),
	type: z.string(),
	comment: z.string().optional(),
	attributes: attributes.optional(),
});
const executionOutput = z.object({
	columns: z.array(z.string()),
	rows: z.array(attributes),
	durationMs: z.number().min(0),
	affectedRows: z.union([z.number(), z.string()]).optional(),
	lastInsertId: z.string().optional(),
	warnings: z.array(z.string()).optional(),
});

export const SqlMethodOutputs = {
	ping: z.object({ ok: z.boolean(), durationMs: z.number().min(0), version: z.string().optional() }),
	query: executionOutput,
	exec: executionOutput,
	listObject: z.array(objectOutput),
	describeObject: z.object({
		object: objectOutput,
		children: z.array(objectOutput).optional(),
		attributes: attributes.optional(),
		durationMs: z.number().min(0).optional(),
	}),
};

const sql = oc.$meta<ServiceToolMeta>({});
function meta(description: string, readOnly = true): ServiceToolMeta {
	return { description, readOnlyHint: readOnly, destructiveHint: !readOnly };
}

/** Canonical oRPC router; the legacy static descriptor remains available separately. */
export const SqlServiceContract = {
	ping: sql.input(SqlMethodInputs.ping).output(SqlMethodOutputs.ping)
		.meta(meta('Check SQL connectivity and report database version and latency')),
	query: sql.input(SqlMethodInputs.query).output(SqlMethodOutputs.query)
		.meta(meta('Execute one read-only SQL statement with bound parameters and bounded pagination')),
	exec: sql.input(SqlMethodInputs.exec).output(SqlMethodOutputs.exec)
		.meta(meta('Execute one SQL statement with bound parameters; requires a writable service', false)),
	listObject: sql.input(SqlMethodInputs.listObject).output(SqlMethodOutputs.listObject)
		.meta(meta('List database objects under an optional parent with search and bounded pagination')),
	describeObject: sql.input(SqlMethodInputs.describeObject).output(SqlMethodOutputs.describeObject)
		.meta(meta('Describe a named database object, its children and attributes')),
};

/** Browser-safe compatibility projection; catalog derives TypeScript from these schemas. */
export const SqlStaticServiceContract = {
	methods: Object.fromEntries(Object.entries(SqlServiceContract).map(([name, procedure]) => [name, {
		description: procedure['~orpc'].meta.description,
		inputSchema: toJsonSchema(procedure['~orpc'].inputSchema!),
		outputSchema: toJsonSchema(procedure['~orpc'].outputSchema!),
	}])),
} satisfies ServiceContract;

export type SqlServiceInputs = InferContractRouterInputs<typeof SqlServiceContract>;
export type SqlServiceOutputs = InferContractRouterOutputs<typeof SqlServiceContract>;
export type SqlServiceClientContext = { timeoutMs?: number };
export type ISqlServiceContract = ContractRouterClient<typeof SqlServiceContract, SqlServiceClientContext>;
export type SqlServiceCallOptions = NonNullable<Parameters<ISqlServiceContract['query']>[1]>;
/** Compatibility name for consumers of the old static `.methods` descriptor. */
export { SqlStaticServiceContract as SqlContract };
