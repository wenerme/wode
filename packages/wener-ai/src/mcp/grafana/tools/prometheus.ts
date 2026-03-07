import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';
import { resolveTimeRange } from '../utils';

const LabelMatcherSchema = z.object({
	name: z.string(),
	value: z.string(),
	type: z.enum(['=', '!=', '=~', '!~']).default('='),
});

function buildPromSelector(metric: string | undefined, matchers: Array<z.infer<typeof LabelMatcherSchema>> = []) {
	if (!metric && matchers.length === 0) return '{}';
	const matcherText = matchers.map((item) => `${item.name}${item.type}"${item.value}"`).join(',');
	if (!metric) return `{${matcherText}}`;
	return matcherText ? `${metric}{${matcherText}}` : metric;
}

export function registerPrometheusTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'list_prometheus_metric_metadata',
		{
			description: 'List Prometheus metric metadata',
			inputSchema: z.object({
				datasourceUid: z.string(),
				metric: z.string().nullish(),
				limit: z.number().int().min(1).max(1000).default(10),
			}),
			readOnly: true,
		},
		({ datasourceUid, metric, limit }) =>
			ctx.client.datasourceProxyRequest(datasourceUid, '/api/v1/metadata', {
				params: {
					metric,
					limit,
				},
			}),
	);

	registerJsonTool(
		ctx,
		'query_prometheus',
		{
			description: 'Query a Prometheus-compatible datasource using PromQL',
			inputSchema: z.object({
				datasourceUid: z.string(),
				expr: z.string(),
				queryType: z.enum(['instant', 'range']).default('range'),
				startTime: z.string().nullish(),
				endTime: z.string().nullish(),
				stepSeconds: z.number().int().positive().default(60),
			}),
			readOnly: true,
		},
		async ({ datasourceUid, expr, queryType, startTime, endTime, stepSeconds }) => {
			if (queryType === 'instant') {
				const end = resolveTimeRange({ to: endTime });
				return ctx.client.datasourceProxyRequest(datasourceUid, '/api/v1/query', {
					params: {
						query: expr,
						time: end.toIso,
					},
				});
			}

			const range = resolveTimeRange({ from: startTime, to: endTime });
			return ctx.client.datasourceProxyRequest(datasourceUid, '/api/v1/query_range', {
				params: {
					query: expr,
					start: range.fromIso,
					end: range.toIso,
					step: stepSeconds,
				},
			});
		},
	);

	registerJsonTool(
		ctx,
		'list_prometheus_metric_names',
		{
			description: 'List Prometheus metric names with regex filtering and pagination',
			inputSchema: z.object({
				datasourceUid: z.string(),
				regex: z.string().nullish(),
				limit: z.number().int().min(1).max(1000).default(50),
				page: z.number().int().min(1).default(1),
			}),
			readOnly: true,
		},
		async ({ datasourceUid, regex, limit, page }) => {
			const response = await ctx.client.datasourceProxyRequest<{ data?: string[] }>(
				datasourceUid,
				'/api/v1/label/__name__/values',
			);
			const all = Array.isArray(response.data) ? response.data : [];
			const filtered = regex ? all.filter((item) => new RegExp(regex).test(item)) : all;
			const offset = (page - 1) * limit;
			return filtered.slice(offset, offset + limit);
		},
	);

	registerJsonTool(
		ctx,
		'list_prometheus_label_names',
		{
			description: 'List Prometheus label names',
			inputSchema: z.object({
				datasourceUid: z.string(),
				metric: z.string().nullish(),
				matchers: z.array(LabelMatcherSchema).default([]),
				startTime: z.string().nullish(),
				endTime: z.string().nullish(),
			}),
			readOnly: true,
		},
		async ({ datasourceUid, metric, matchers, startTime, endTime }) => {
			const range = resolveTimeRange({ from: startTime, to: endTime });
			return ctx.client.datasourceProxyRequest(datasourceUid, '/api/v1/labels', {
				params: {
					'match[]': buildPromSelector(metric || undefined, matchers),
					start: range.fromIso,
					end: range.toIso,
				},
			});
		},
	);

	registerJsonTool(
		ctx,
		'list_prometheus_label_values',
		{
			description: 'List Prometheus label values for a label name',
			inputSchema: z.object({
				datasourceUid: z.string(),
				labelName: z.string(),
				metric: z.string().nullish(),
				matchers: z.array(LabelMatcherSchema).default([]),
				startTime: z.string().nullish(),
				endTime: z.string().nullish(),
			}),
			readOnly: true,
		},
		async ({ datasourceUid, labelName, metric, matchers, startTime, endTime }) => {
			const range = resolveTimeRange({ from: startTime, to: endTime });
			return ctx.client.datasourceProxyRequest(
				datasourceUid,
				`/api/v1/label/${encodeURIComponent(labelName)}/values`,
				{
					params: {
						'match[]': buildPromSelector(metric || undefined, matchers),
						start: range.fromIso,
						end: range.toIso,
					},
				},
			);
		},
	);

	registerJsonTool(
		ctx,
		'query_prometheus_histogram',
		{
			description: 'Query histogram percentiles from Prometheus buckets',
			inputSchema: z.object({
				datasourceUid: z.string(),
				metric: z.string().describe('Histogram bucket metric name, usually ending with _bucket'),
				quantile: z.number().min(0).max(1).default(0.95),
				groupBy: z.array(z.string()).default([]),
				window: z.string().default('5m'),
				startTime: z.string().nullish(),
				endTime: z.string().nullish(),
				stepSeconds: z.number().int().positive().default(60),
			}),
			readOnly: true,
		},
		async ({ datasourceUid, metric, quantile, groupBy, window, startTime, endTime, stepSeconds }) => {
			const byClause = ['le', ...groupBy].join(', ');
			const expr = `histogram_quantile(${quantile}, sum(rate(${metric}[${window}])) by (${byClause}))`;
			const range = resolveTimeRange({ from: startTime, to: endTime });
			return ctx.client.datasourceProxyRequest(datasourceUid, '/api/v1/query_range', {
				params: {
					query: expr,
					start: range.fromIso,
					end: range.toIso,
					step: stepSeconds,
				},
			});
		},
	);
}
