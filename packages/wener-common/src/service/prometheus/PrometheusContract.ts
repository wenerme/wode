import { oc } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };

/** PromQL timestamp: Unix epoch seconds (number) or RFC3339 string. */
const time = z.union([z.number().refine(Number.isFinite), z.string().min(1).max(256)]);
/** Series selector(s), e.g. `up{job="prometheus"}`. */
const match = z.array(z.string().min(1)).min(1).max(10_000);

export const PrometheusQueryInputSchema = z.strictObject({
	query: z.string().min(1),
	time: time.optional(),
	timeout: z.string().min(1).max(256).optional(),
});
export const PrometheusQueryOutputSchema = z.unknown();

export const PrometheusQueryRangeInputSchema = z.strictObject({
	query: z.string().min(1),
	start: time,
	end: time,
	step: time,
	timeout: z.string().min(1).max(256).optional(),
});
export const PrometheusQueryRangeOutputSchema = z.unknown();

export const PrometheusSeriesInputSchema = z.strictObject({
	match,
	start: time.optional(),
	end: time.optional(),
});
export const PrometheusSeriesOutputSchema = z.unknown();

export const PrometheusLabelsInputSchema = z.strictObject({
	match: match.optional(),
	start: time.optional(),
	end: time.optional(),
});
export const PrometheusLabelsOutputSchema = z.unknown();

export const PrometheusLabelValuesInputSchema = z.strictObject({
	label: z.string().min(1),
	match: match.optional(),
	start: time.optional(),
	end: time.optional(),
});
export const PrometheusLabelValuesOutputSchema = z.unknown();

export const PrometheusMetadataInputSchema = z.strictObject({
	limit: z.number().int().min(1).max(1_000_000).optional(),
	metric: z.string().min(1).optional(),
});
export const PrometheusMetadataOutputSchema = z.unknown();

/**
 * oRPC contract-first definition: the single source of truth for input/output schemas and
 * MCP-style tool metadata (`.meta()`). Prometheus is a strictly read-only service -- every
 * procedure here is a query, hence the shared `readOnlyTool` meta. See
 * packages/wener-common/src/service/cls/TencentClsContract.ts for the pattern this mirrors.
 */
export const PrometheusContract = {
	query: oc.input(PrometheusQueryInputSchema).output(PrometheusQueryOutputSchema).meta(readOnlyTool),
	queryRange: oc.input(PrometheusQueryRangeInputSchema).output(PrometheusQueryRangeOutputSchema).meta(readOnlyTool),
	series: oc.input(PrometheusSeriesInputSchema).output(PrometheusSeriesOutputSchema).meta(readOnlyTool),
	labels: oc.input(PrometheusLabelsInputSchema).output(PrometheusLabelsOutputSchema).meta(readOnlyTool),
	labelValues: oc.input(PrometheusLabelValuesInputSchema).output(PrometheusLabelValuesOutputSchema).meta(readOnlyTool),
	metadata: oc.input(PrometheusMetadataInputSchema).output(PrometheusMetadataOutputSchema).meta(readOnlyTool),
};
