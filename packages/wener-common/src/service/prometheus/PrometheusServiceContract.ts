import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import type { PrometheusRequestOptions } from '@wener/client/prometheus';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const prometheus = oc.$meta<ServiceToolMeta>({});
const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };

const finiteNumber = z.number().refine(Number.isFinite);
const time = z.union([finiteNumber, z.string().min(1).max(256)]);
const match = z.array(z.string().min(1)).min(1).max(10_000);

/** Prometheus metric labels are dynamic keys whose protocol values are strings. */
export const PrometheusMetricSchema = z.record(z.string(), z.string());
export const PrometheusSampleSchema = z.tuple([finiteNumber, z.string()]);
export const PrometheusQueryResultSchema = z.discriminatedUnion('resultType', [
	z.strictObject({ resultType: z.literal('scalar'), result: PrometheusSampleSchema }),
	z.strictObject({ resultType: z.literal('string'), result: PrometheusSampleSchema }),
	z.strictObject({
		resultType: z.literal('vector'),
		result: z.array(z.strictObject({ metric: PrometheusMetricSchema, value: PrometheusSampleSchema })),
	}),
	z.strictObject({
		resultType: z.literal('matrix'),
		result: z.array(z.strictObject({ metric: PrometheusMetricSchema, values: z.array(PrometheusSampleSchema) })),
	}),
]);
const warnings = z.array(z.string());
const success = <T extends z.ZodType>(data: T) => z.strictObject({ status: z.literal('success'), data, warnings });

export const PrometheusQueryInputSchema = z.strictObject({
	query: z.string().min(1),
	time: time.optional(),
	/** Prometheus server-side query timeout, distinct from transport timeoutMs in client context. */
	timeout: z.string().min(1).max(256).optional(),
});
export const PrometheusQueryOutputSchema = success(PrometheusQueryResultSchema);

export const PrometheusQueryRangeInputSchema = z.strictObject({
	query: z.string().min(1),
	start: time,
	end: time,
	step: time,
	/** Prometheus server-side query timeout, distinct from transport timeoutMs in client context. */
	timeout: z.string().min(1).max(256).optional(),
});
export const PrometheusQueryRangeOutputSchema = success(PrometheusQueryResultSchema);

export const PrometheusSeriesInputSchema = z.strictObject({
	match,
	start: time.optional(),
	end: time.optional(),
});
export const PrometheusSeriesOutputSchema = success(z.array(PrometheusMetricSchema));

export const PrometheusLabelsInputSchema = z.strictObject({
	match: match.optional(),
	start: time.optional(),
	end: time.optional(),
}).default({});
export const PrometheusLabelsOutputSchema = success(z.array(z.string()));

export const PrometheusLabelValuesInputSchema = z.strictObject({
	label: z.string().min(1),
	match: match.optional(),
	start: time.optional(),
	end: time.optional(),
});
export const PrometheusLabelValuesOutputSchema = success(z.array(z.string()));

export const PrometheusMetadataInputSchema = z.strictObject({
	limit: z.number().int().min(1).max(1_000_000).optional(),
	metric: z.string().min(1).optional(),
}).default({});
export const PrometheusMetadataOutputSchema = success(z.record(z.string(), z.array(z.strictObject({
	type: z.string(),
	help: z.string(),
	unit: z.string(),
}))));

/**
 * Prometheus response data has a stable success envelope. Dynamic metric-label keys and
 * protocol values remain represented by records/tuples; the client performs the same
 * bounded protocol validation before returning these values. Query results are a tagged
 * union because Prometheus exposes scalar, string, vector and matrix result types.
 */
export const PrometheusServiceContract = {
	query: prometheus.input(PrometheusQueryInputSchema).output(PrometheusQueryOutputSchema).meta(readOnlyTool),
	queryRange: prometheus.input(PrometheusQueryRangeInputSchema).output(PrometheusQueryRangeOutputSchema).meta(readOnlyTool),
	series: prometheus.input(PrometheusSeriesInputSchema).output(PrometheusSeriesOutputSchema).meta(readOnlyTool),
	labels: prometheus.input(PrometheusLabelsInputSchema).output(PrometheusLabelsOutputSchema).meta(readOnlyTool),
	labelValues: prometheus.input(PrometheusLabelValuesInputSchema).output(PrometheusLabelValuesOutputSchema).meta(readOnlyTool),
	metadata: prometheus.input(PrometheusMetadataInputSchema).output(PrometheusMetadataOutputSchema).meta(readOnlyTool),
};

export type PrometheusServiceInputs = InferContractRouterInputs<typeof PrometheusServiceContract>;
export type PrometheusServiceOutputs = InferContractRouterOutputs<typeof PrometheusServiceContract>;
export type PrometheusServiceClientContext = Pick<PrometheusRequestOptions, 'timeoutMs'>;
export type IPrometheusServiceContract = ContractRouterClient<typeof PrometheusServiceContract, PrometheusServiceClientContext>;
export type PrometheusServiceCallOptions = NonNullable<Parameters<IPrometheusServiceContract['query']>[1]>;
