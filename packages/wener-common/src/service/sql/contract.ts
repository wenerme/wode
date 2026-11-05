import { z } from 'zod';
import type { ServiceContract, ServiceMethodContract } from '../runtime/types';

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
const statement = { statement: z.string().regex(/\S/), params: z.array(z.json()).optional() };

/** Shared transport inputs; validation and SQL read-only policy remain in the service core. */
export const SqlMethodInputs = {
	ping: z.strictObject({}),
	query: z.strictObject({ ...statement, ...page }),
	exec: z.strictObject(statement),
	listObject: z.strictObject({ parent: objectReference.optional(), search: z.string().optional(), ...page }),
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

const referenceType = '{ catalog?: string; schema?: string; name?: string; type?: string }';
const objectType = '{ catalog?: string; schema?: string; name: string; type: string; comment?: string; attributes?: Record<string, unknown> }';
const statementType = 'statement: string; params?: readonly unknown[]';
const pageType = 'limit?: number; offset?: number';
const executionType = '{ columns: string[]; rows: Record<string, unknown>[]; durationMs: number; affectedRows?: number | string; lastInsertId?: string; warnings?: string[] }';

const methods = {
	ping: {
		description: 'Check SQL connectivity and report database version and latency',
		inputType: 'Record<string, never>',
		outputType: '{ ok: boolean; durationMs: number; version?: string }',
	},
	query: {
		description: 'Execute one read-only SQL statement with bound parameters and bounded pagination',
		inputType: `{ ${statementType}; ${pageType} }`,
		outputType: executionType,
	},
	exec: {
		description: 'Execute one SQL statement with bound parameters; requires a writable service',
		inputType: `{ ${statementType} }`,
		outputType: executionType,
	},
	listObject: {
		description: 'List database objects under an optional parent with search and bounded pagination',
		inputType: `{ parent?: ${referenceType}; search?: string; ${pageType} }`,
		outputType: `${objectType}[]`,
	},
	describeObject: {
		description: 'Describe a named database object, its children and attributes',
		inputType: `{ object: ${referenceType} & { name: string } }`,
		outputType: `{ object: ${objectType}; children?: ${objectType}[]; attributes?: Record<string, unknown>; durationMs?: number }`,
	},
} satisfies Record<keyof typeof SqlMethodInputs, ServiceMethodContract>;

/** Browser-safe metadata only: discovery never constructs a driver or resolves credentials. */
export const SqlServiceContract = {
	methods: Object.fromEntries(
		Object.entries(methods).map(([name, method]) => [
			name,
			{
				...method,
				inputSchema: z.toJSONSchema(SqlMethodInputs[name as keyof typeof methods]),
				outputSchema: z.toJSONSchema(SqlMethodOutputs[name as keyof typeof methods]),
			},
		]),
	),
} satisfies ServiceContract;
