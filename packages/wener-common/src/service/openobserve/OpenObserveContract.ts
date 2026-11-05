import { oc } from '@orpc/contract';
import { validateOpenObserveStreamSettingsUpdate } from '@wener/client/openobserve';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
const writeTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: false };
const destructiveWriteTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };

export const OpenObserveWriteOperations = new Set(['updateStreamSettings', 'deleteStream', 'ingestJson', 'ingestMulti']);

const page = {
	offset: z.number().int().min(0).max(2_147_483_647).optional(),
};
const stream = {
	organization: z.string().optional(),
	stream: z.string().min(1),
	streamType: z.enum(['logs', 'metrics', 'traces']).optional(),
};

export const OpenObserveHealthInputSchema = z.strictObject({});
export const OpenObserveStatusInputSchema = z.strictObject({
	organization: z.string().optional(),
	streamType: z.enum(['logs', 'metrics', 'traces']).optional(),
});
export const OpenObserveListStreamsInputSchema = z.strictObject({
	organization: z.string().optional(),
	streamType: z.enum(['logs', 'metrics', 'traces']).optional(),
	...page,
	limit: z.number().int().min(1).max(1000).optional(),
	fetchSchema: z.boolean().optional(),
	keyword: z.string().optional(),
});
export const OpenObserveGetStreamSchemaInputSchema = z.strictObject({
	organization: z.string().optional(),
	stream: z.string().min(1),
	streamType: z.enum(['logs', 'metrics', 'traces']).optional(),
	...page,
	limit: z.number().int().min(1).max(1000).optional(),
	keyword: z.string().optional(),
});
export const OpenObserveSearchInputSchema = z.strictObject({
	organization: z.string().optional(),
	streamType: z.enum(['logs', 'metrics', 'traces']).optional(),
	sql: z.string().min(1).max(65536),
	startTimeMicros: z.number().int().nonnegative(),
	endTimeMicros: z.number().int().nonnegative(),
	from: z.number().int().nonnegative().optional(),
	size: z.number().int().min(1).max(1000).optional(),
	timeoutSeconds: z.number().int().min(1).max(60).optional(),
});
export const OpenObserveListTracesInputSchema = z.strictObject({
	organization: z.string().optional(),
	stream: z.string().min(1),
	startTimeMicros: z.number().int().nonnegative(),
	endTimeMicros: z.number().int().nonnegative(),
	from: z.number().int().nonnegative().optional(),
	size: z.number().int().min(1).max(1000).optional(),
	filter: z.string().optional(),
	timeoutSeconds: z.number().int().min(1).max(60).optional(),
	sortBy: z.enum(['start_time', 'duration']).optional(),
	sortOrder: z.enum(['asc', 'desc']).optional(),
});
export const OpenObserveGetStreamSettingsInputSchema = z.strictObject(stream);
export const OpenObserveUpdateStreamSettingsInputSchema = z.strictObject({
	...stream,
	settings: z.record(z.string(), z.json()).superRefine((value, context) => {
		try {
			validateOpenObserveStreamSettingsUpdate(value);
		} catch {
			context.addIssue({ code: 'custom', message: 'Invalid OpenObserve settings' });
		}
	}),
});
export const OpenObserveDeleteStreamInputSchema = z.strictObject({ ...stream, deleteAll: z.boolean().optional() });
export const OpenObserveIngestJsonInputSchema = z.strictObject({
	organization: z.string().optional(),
	stream: z.string().min(1),
	records: z.array(z.record(z.string(), z.json())).min(1).max(10_000),
});
export const OpenObserveIngestMultiInputSchema = z.strictObject({
	organization: z.string().optional(),
	stream: z.string().min(1),
	records: z.union([z.string().min(1), z.array(z.record(z.string(), z.json())).min(1).max(10_000)]),
});
export const OpenObserveGetValuesInputSchema = z.strictObject({
	...stream,
	fields: z.array(z.string().min(1)).min(1).max(100),
	startTimeMicros: z.number().int().nonnegative(),
	endTimeMicros: z.number().int().nonnegative(),
	size: z.number().int().min(1).max(1000).optional(),
	keyword: z.string().optional(),
	noCount: z.boolean().optional(),
});
export const OpenObserveSearchAroundInputSchema = z.strictObject({
	...stream,
	key: z.number().int().nonnegative(),
	size: z.number().int().min(1).max(1000).optional(),
});

const output = z.unknown();

/**
 * oRPC contract-first definition: the single source of truth for input/output schemas and
 * MCP-style tool metadata (`.meta()`). See TencentClsContract.ts for the established pattern
 * this mirrors; `createServiceOperationFromContract`/`defineContractOperation`
 * (packages/wener-common/src/service/runtime/contract.ts) derives the local `ServiceOperation`
 * tool metadata from this contract, replacing the hand-rolled `ServiceTool` JSON Schema
 * previously in schema.ts.
 */
export const OpenObserveContract = {
	health: oc.input(OpenObserveHealthInputSchema).output(output).meta(readOnlyTool),
	status: oc.input(OpenObserveStatusInputSchema).output(output).meta(readOnlyTool),
	listStreams: oc.input(OpenObserveListStreamsInputSchema).output(output).meta(readOnlyTool),
	getStreamSchema: oc.input(OpenObserveGetStreamSchemaInputSchema).output(output).meta(readOnlyTool),
	search: oc.input(OpenObserveSearchInputSchema).output(output).meta(readOnlyTool),
	listTraces: oc.input(OpenObserveListTracesInputSchema).output(output).meta(readOnlyTool),
	getStreamSettings: oc.input(OpenObserveGetStreamSettingsInputSchema).output(output).meta(readOnlyTool),
	updateStreamSettings: oc.input(OpenObserveUpdateStreamSettingsInputSchema).output(output).meta(writeTool),
	deleteStream: oc.input(OpenObserveDeleteStreamInputSchema).output(output).meta(destructiveWriteTool),
	ingestJson: oc.input(OpenObserveIngestJsonInputSchema).output(output).meta(writeTool),
	ingestMulti: oc.input(OpenObserveIngestMultiInputSchema).output(output).meta(writeTool),
	getValues: oc.input(OpenObserveGetValuesInputSchema).output(output).meta(readOnlyTool),
	searchAround: oc.input(OpenObserveSearchAroundInputSchema).output(output).meta(readOnlyTool),
};
