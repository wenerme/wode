import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';
import { resolveTimeRange } from '../utils';

export function registerLokiTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'list_loki_label_names',
		{
			description: 'List label names in a Loki datasource',
			inputSchema: z.object({
				datasourceUid: z.string(),
				startRfc3339: z.string().nullish(),
				endRfc3339: z.string().nullish(),
			}),
			readOnly: true,
		},
		async ({ datasourceUid, startRfc3339, endRfc3339 }) => {
			const range = resolveTimeRange({ from: startRfc3339, to: endRfc3339 });
			return ctx.client.datasourceProxyRequest(datasourceUid, '/loki/api/v1/labels', {
				params: {
					start: range.fromIso,
					end: range.toIso,
				},
			});
		},
	);

	registerJsonTool(
		ctx,
		'list_loki_label_values',
		{
			description: 'List label values in a Loki datasource',
			inputSchema: z.object({
				datasourceUid: z.string(),
				labelName: z.string(),
				startRfc3339: z.string().nullish(),
				endRfc3339: z.string().nullish(),
			}),
			readOnly: true,
		},
		async ({ datasourceUid, labelName, startRfc3339, endRfc3339 }) => {
			const range = resolveTimeRange({ from: startRfc3339, to: endRfc3339 });
			return ctx.client.datasourceProxyRequest(datasourceUid, `/loki/api/v1/label/${encodeURIComponent(labelName)}/values`, {
				params: {
					start: range.fromIso,
					end: range.toIso,
				},
			});
		},
	);

	registerJsonTool(
		ctx,
		'query_loki_logs',
		{
			description: 'Run a LogQL query against a Loki datasource',
			inputSchema: z.object({
				datasourceUid: z.string(),
				query: z.string(),
				startTime: z.string().nullish(),
				endTime: z.string().nullish(),
				limit: z.number().int().min(1).max(1000).default(100),
				direction: z.enum(['forward', 'backward']).default('backward'),
				stepSeconds: z.number().int().positive().default(60),
			}),
			readOnly: true,
		},
		async ({ datasourceUid, query, startTime, endTime, limit, direction, stepSeconds }) => {
			const range = resolveTimeRange({ from: startTime, to: endTime });
			return ctx.client.datasourceProxyRequest(datasourceUid, '/loki/api/v1/query_range', {
				params: {
					query,
					start: range.fromMs * 1_000_000,
					end: range.toMs * 1_000_000,
					limit,
					direction,
					step: stepSeconds,
				},
			});
		},
	);

	registerJsonTool(
		ctx,
		'query_loki_stats',
		{
			description: 'Fetch Loki index statistics for a LogQL selector',
			inputSchema: z.object({
				datasourceUid: z.string(),
				query: z.string(),
				startTime: z.string().nullish(),
				endTime: z.string().nullish(),
			}),
			readOnly: true,
		},
		async ({ datasourceUid, query, startTime, endTime }) => {
			const range = resolveTimeRange({ from: startTime, to: endTime });
			return ctx.client.datasourceProxyRequest(datasourceUid, '/loki/api/v1/index/stats', {
				params: {
					query,
					start: range.fromMs * 1_000_000,
					end: range.toMs * 1_000_000,
				},
			});
		},
	);

	registerJsonTool(
		ctx,
		'query_loki_patterns',
		{
			description: 'Fetch detected Loki log patterns',
			inputSchema: z.object({
				datasourceUid: z.string(),
				query: z.string(),
				startTime: z.string().nullish(),
				endTime: z.string().nullish(),
				limit: z.number().int().min(1).max(1000).default(50),
			}),
			readOnly: true,
		},
		async ({ datasourceUid, query, startTime, endTime, limit }) => {
			const range = resolveTimeRange({ from: startTime, to: endTime });
			return ctx.client.datasourceProxyRequest(datasourceUid, '/loki/api/v1/patterns', {
				params: {
					query,
					start: range.fromMs * 1_000_000,
					end: range.toMs * 1_000_000,
					limit,
				},
			});
		},
	);
}
