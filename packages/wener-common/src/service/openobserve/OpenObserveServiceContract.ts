import {
	oc,
	type ContractRouterClient,
	type InferContractRouterInputs,
	type InferContractRouterOutputs,
} from '@orpc/contract';
import type {
	OpenObserveGetValuesResult as ClientOpenObserveGetValuesResult,
	OpenObserveIngestResult as ClientOpenObserveIngestResult,
	OpenObserveListStreamResult as ClientOpenObserveListStreamResult,
	OpenObserveListTraceResult as ClientOpenObserveListTraceResult,
	OpenObserveMutationResult as ClientOpenObserveMutationResult,
	OpenObserveRequestOptions,
	OpenObserveSearchResult as ClientOpenObserveSearchResult,
	OpenObserveStatus as ClientOpenObserveStatus,
	OpenObserveStreamSchemaResult as ClientOpenObserveStreamSchemaResult,
	OpenObserveStreamSettingsResult as ClientOpenObserveStreamSettingsResult,
	OpenObserveUpdateStreamSettings,
	OpenObserveUpdateStreamSettingsInput as ClientOpenObserveUpdateStreamSettingsInput,
	OpenObserveStreamType,
} from '@wener/client/openobserve';
import { validateOpenObserveStreamSettingsUpdate } from '@wener/client/openobserve';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const openobserve = oc.$meta<ServiceToolMeta>({});
const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
const writeTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: false };
const destructiveWriteTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };

const streamType = z.enum(['logs', 'metrics', 'traces']);
const page = {
	offset: z.number().int().min(0).max(2_147_483_647).optional(),
};
const stream = {
	organization: z.string().optional(),
	stream: z.string().min(1),
	streamType: streamType.optional(),
};
const jsonValue = z.json();
const dynamicRecord = z.record(z.string(), z.unknown());

export const OpenObserveHealthInputSchema = z.strictObject({}).default({});
export const OpenObserveStatusInputSchema = z.strictObject({
	organization: z.string().optional(),
	streamType: streamType.optional(),
}).default({});
export const OpenObserveListStreamsInputSchema = z.strictObject({
	organization: z.string().optional(),
	streamType: streamType.optional(),
	...page,
	limit: z.number().int().min(1).max(1000).optional(),
	fetchSchema: z.boolean().optional(),
	keyword: z.string().optional(),
}).default({});
export const OpenObserveGetStreamSchemaInputSchema = z.strictObject({
	organization: z.string().optional(),
	stream: z.string().min(1),
	streamType: streamType.optional(),
	...page,
	limit: z.number().int().min(1).max(1000).optional(),
	keyword: z.string().optional(),
});
export const OpenObserveSearchInputSchema = z.strictObject({
	organization: z.string().optional(),
	streamType: streamType.optional(),
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
const OpenObserveSettingsUpdateInputSchema = z.record(z.string(), jsonValue).superRefine((value, context) => {
	try {
		validateOpenObserveStreamSettingsUpdate(value);
	} catch {
		context.addIssue({ code: 'custom', message: 'Invalid OpenObserve settings' });
	}
}) as z.ZodType<OpenObserveUpdateStreamSettings>;
export const OpenObserveUpdateStreamSettingsInputSchema = z.strictObject({
	...stream,
	settings: OpenObserveSettingsUpdateInputSchema,
}) as z.ZodType<ClientOpenObserveUpdateStreamSettingsInput, ClientOpenObserveUpdateStreamSettingsInput>;
export const OpenObserveDeleteStreamInputSchema = z.strictObject({ ...stream, deleteAll: z.boolean().optional() });
export const OpenObserveIngestJsonInputSchema = z.strictObject({
	organization: z.string().optional(),
	stream: z.string().min(1),
	records: z.array(z.record(z.string(), jsonValue)).min(1).max(10_000),
});
export const OpenObserveIngestMultiInputSchema = z.strictObject({
	organization: z.string().optional(),
	stream: z.string().min(1),
	records: z.union([z.string().min(1), z.array(z.record(z.string(), jsonValue)).min(1).max(10_000)]),
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

export const OpenObserveHealthOutputSchema = z.object({ status: z.literal('ok') });
export const OpenObserveStatusOutputSchema = z.looseObject({
	reachable: z.boolean(),
	readOnly: z.literal(true),
	streamType,
	authConfigured: z.boolean(),
	endpointCount: z.number().int().nonnegative(),
	latencyMs: z.number().nonnegative(),
	checkedAt: z.string(),
	error: z.looseObject({ code: z.string(), message: z.string() }).optional(),
}) as z.ZodType<ClientOpenObserveStatus>;
export const OpenObserveListStreamsOutputSchema = z.looseObject({
	streams: z.array(z.looseObject({
		organization: z.string(),
		name: z.string(),
		streamType: z.string(),
		documentCount: z.number().nonnegative().optional(),
		storageBytes: z.number().nonnegative().optional(),
		schemaFields: z.array(z.string()),
	})),
	total: z.number().int().nonnegative(),
}) as z.ZodType<ClientOpenObserveListStreamResult>;
export const OpenObserveStreamSchemaOutputSchema = z.looseObject({
	organization: z.string(),
	stream: z.string(),
	streamType: z.string(),
	fields: z.array(z.looseObject({ name: z.string(), type: z.string() })),
	totalFields: z.number().int().nonnegative(),
}) as z.ZodType<ClientOpenObserveStreamSchemaResult>;
const queryEnvelope = {
	streamType,
	total: z.number().int().nonnegative(),
	from: z.number().int().nonnegative(),
	size: z.number().int().nonnegative(),
	tookMs: z.number().nonnegative().optional(),
	scanBytes: z.number().nonnegative().optional(),
	isPartial: z.boolean(),
	functionErrors: z.array(z.string()),
	traceId: z.string().optional(),
};
export const OpenObserveSearchOutputSchema = z.looseObject({ ...queryEnvelope, hits: z.array(z.unknown()) }) as z.ZodType<ClientOpenObserveSearchResult>;
export const OpenObserveListTracesOutputSchema = z.looseObject({
	streamType: z.literal('traces'),
	traces: z.array(z.unknown()),
	total: z.number().int().nonnegative(),
	from: z.number().int().nonnegative(),
	size: z.number().int().nonnegative(),
	tookMs: z.number().nonnegative().optional(),
	isPartial: z.boolean(),
	functionErrors: z.array(z.string()),
	traceId: z.string().optional(),
}) as z.ZodType<ClientOpenObserveListTraceResult>;
const streamSettings = z.looseObject({
	partition_keys: z.union([z.array(z.looseObject({ field: z.string(), types: z.union([z.literal('value'), z.literal('prefix'), z.looseObject({ hash: z.number().int() })]).optional(), disabled: z.boolean().optional() })), dynamicRecord]).optional(),
	index_fields: z.array(z.string()).optional(),
	full_text_search_keys: z.array(z.string()).optional(),
	bloom_filter_fields: z.array(z.string()).optional(),
	defined_schema_fields: z.array(z.string()).optional(),
	data_retention: z.number().int().nonnegative().optional(),
	flatten_level: z.number().int().nonnegative().optional(),
	max_query_range: z.number().int().nonnegative().optional(),
	store_original_data: z.boolean().optional(),
	approx_partition: z.boolean().optional(),
	index_original_data: z.boolean().optional(),
	index_all_values: z.boolean().optional(),
	extended_retention_days: z.array(z.unknown()).optional(),
});
const streamSettingsResult = z.looseObject({
	organization: z.string(), stream: z.string(), streamType,
	settings: streamSettings,
});
// Preserve native JSON Schema for optional unions; the shared OpenAPI-oriented
// exporter otherwise adds a typeless nullable keyword to those properties.
export const OpenObserveStreamSettingsOutputSchema = streamSettingsResult.meta(
	z.toJSONSchema(streamSettingsResult),
) as z.ZodType<ClientOpenObserveStreamSettingsResult>;
export const OpenObserveMutationOutputSchema = z.looseObject({ code: z.number().int().min(200).max(299), message: z.string().optional() }) as z.ZodType<ClientOpenObserveMutationResult>;
export const OpenObserveIngestOutputSchema = z.looseObject({
	code: z.number().int().min(200).max(599),
	status: z.array(z.looseObject({ name: z.string(), successful: z.number().int().nonnegative(), failed: z.number().int().nonnegative(), error: z.string().optional() })),
}) as z.ZodType<ClientOpenObserveIngestResult>;
export const OpenObserveGetValuesOutputSchema = z.looseObject({
	hits: z.array(z.looseObject({
		field: z.string(),
		values: z.array(z.looseObject({ zo_sql_key: z.unknown(), zo_sql_num: z.number().int().nonnegative().optional() })),
	})),
	total: z.number().int().nonnegative(),
	tookMs: z.number().nonnegative().optional(),
	scanBytes: z.number().nonnegative().optional(),
}) as z.ZodType<ClientOpenObserveGetValuesResult>;

/** oRPC contract is the single source for OpenObserve inputs, outputs and tool metadata. */
export const OpenObserveServiceContract = {
	health: openobserve.input(OpenObserveHealthInputSchema).output(OpenObserveHealthOutputSchema).meta(readOnlyTool),
	status: openobserve.input(OpenObserveStatusInputSchema).output(OpenObserveStatusOutputSchema).meta(readOnlyTool),
	listStreams: openobserve.input(OpenObserveListStreamsInputSchema).output(OpenObserveListStreamsOutputSchema).meta(readOnlyTool),
	getStreamSchema: openobserve.input(OpenObserveGetStreamSchemaInputSchema).output(OpenObserveStreamSchemaOutputSchema).meta(readOnlyTool),
	search: openobserve.input(OpenObserveSearchInputSchema).output(OpenObserveSearchOutputSchema).meta(readOnlyTool),
	listTraces: openobserve.input(OpenObserveListTracesInputSchema).output(OpenObserveListTracesOutputSchema).meta(readOnlyTool),
	getStreamSettings: openobserve.input(OpenObserveGetStreamSettingsInputSchema).output(OpenObserveStreamSettingsOutputSchema).meta(readOnlyTool),
	updateStreamSettings: openobserve.input(OpenObserveUpdateStreamSettingsInputSchema).output(OpenObserveMutationOutputSchema).meta(writeTool),
	deleteStream: openobserve.input(OpenObserveDeleteStreamInputSchema).output(OpenObserveMutationOutputSchema).meta(destructiveWriteTool),
	ingestJson: openobserve.input(OpenObserveIngestJsonInputSchema).output(OpenObserveIngestOutputSchema).meta(writeTool),
	ingestMulti: openobserve.input(OpenObserveIngestMultiInputSchema).output(OpenObserveIngestOutputSchema).meta(writeTool),
	getValues: openobserve.input(OpenObserveGetValuesInputSchema).output(OpenObserveGetValuesOutputSchema).meta(readOnlyTool),
	searchAround: openobserve.input(OpenObserveSearchAroundInputSchema).output(OpenObserveSearchOutputSchema).meta(readOnlyTool),
};

export type OpenObserveServiceInputs = InferContractRouterInputs<typeof OpenObserveServiceContract>;
export type OpenObserveServiceOutputs = InferContractRouterOutputs<typeof OpenObserveServiceContract>;
export type OpenObserveServiceClientContext = Pick<OpenObserveRequestOptions, 'timeoutMs'>;
export type IOpenObserveServiceContract = ContractRouterClient<typeof OpenObserveServiceContract, OpenObserveServiceClientContext>;
export type OpenObserveServiceCallOptions = NonNullable<Parameters<IOpenObserveServiceContract['search']>[1]>;
export type OpenObserveServiceClient = IOpenObserveServiceContract;

export type OpenObserveHealthResult = OpenObserveServiceOutputs['health'];
export type OpenObserveStatus = OpenObserveServiceOutputs['status'];
export type OpenObserveListStreamInput = OpenObserveServiceInputs['listStreams'];
export type OpenObserveListStreamResult = OpenObserveServiceOutputs['listStreams'];
export type OpenObserveGetStreamSchemaInput = OpenObserveServiceInputs['getStreamSchema'];
export type OpenObserveStreamSchemaResult = OpenObserveServiceOutputs['getStreamSchema'];
export type OpenObserveSearchInput = OpenObserveServiceInputs['search'];
export type OpenObserveSearchResult = OpenObserveServiceOutputs['search'];
export type OpenObserveListTraceInput = OpenObserveServiceInputs['listTraces'];
export type OpenObserveListTraceResult = OpenObserveServiceOutputs['listTraces'];
export type OpenObserveGetStreamSettingsInput = OpenObserveServiceInputs['getStreamSettings'];
export type OpenObserveStreamSettingsResult = OpenObserveServiceOutputs['getStreamSettings'];
export type OpenObserveUpdateStreamSettingsInput = OpenObserveServiceInputs['updateStreamSettings'];
export type OpenObserveDeleteStreamInput = OpenObserveServiceInputs['deleteStream'];
export type OpenObserveMutationResult = OpenObserveServiceOutputs['deleteStream'];
export type OpenObserveIngestJsonInput = OpenObserveServiceInputs['ingestJson'];
export type OpenObserveIngestMultiInput = OpenObserveServiceInputs['ingestMulti'];
export type OpenObserveIngestResult = OpenObserveServiceOutputs['ingestJson'];
export type OpenObserveGetValuesInput = OpenObserveServiceInputs['getValues'];
export type OpenObserveGetValuesResult = OpenObserveServiceOutputs['getValues'];
export type OpenObserveSearchAroundInput = OpenObserveServiceInputs['searchAround'];

/** Compatibility set retained for the existing typed remote client and callers. */
export const OpenObserveWriteOperations: ReadonlySet<string> = new Set(
	Object.entries(OpenObserveServiceContract).filter(([, procedure]) => procedure['~orpc'].meta?.readOnlyHint !== true).map(([name]) => name),
);

export type { OpenObserveStreamType };
