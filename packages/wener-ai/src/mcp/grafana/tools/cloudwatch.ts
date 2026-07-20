import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';
import { queryDatasource } from './query-helpers';

export function registerCloudWatchTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'query_cloudwatch',
		{
			description: 'Execute a CloudWatch metric query via Grafana',
			inputSchema: z.object({
				datasourceUid: z.string(),
				namespace: z.string(),
				metricName: z.string(),
				statistic: z.string().default('Average'),
				dimensions: z.record(z.string(), z.string()).default({}),
				region: z.string().nullish(),
				from: z.string().nullish(),
				to: z.string().nullish(),
				period: z.number().int().positive().default(60),
			}),
			readOnly: true,
		},
		({ datasourceUid, namespace, metricName, statistic, dimensions, region, from, to, period }) =>
			queryDatasource(ctx, {
				datasourceUid,
				from,
				to,
				queries: [
					{
						datasourceType: 'cloudwatch',
						namespace,
						metricName,
						statistic,
						dimensions,
						region,
						period,
					},
				],
			}),
	);

	registerJsonTool(
		ctx,
		'list_cloudwatch_namespaces',
		{
			description: 'List CloudWatch namespaces',
			inputSchema: z.object({
				datasourceUid: z.string(),
			}),
			readOnly: true,
		},
		({ datasourceUid }) => ctx.client.datasourceResourceRequest(datasourceUid, '/namespaces'),
	);

	registerJsonTool(
		ctx,
		'list_cloudwatch_metrics',
		{
			description: 'List CloudWatch metrics in a namespace',
			inputSchema: z.object({
				datasourceUid: z.string(),
				namespace: z.string(),
			}),
			readOnly: true,
		},
		({ datasourceUid, namespace }) =>
			ctx.client.datasourceResourceRequest(datasourceUid, '/metrics', {
				method: 'POST',
				body: { namespace },
			}),
	);

	registerJsonTool(
		ctx,
		'list_cloudwatch_dimensions',
		{
			description: 'List CloudWatch dimensions for a metric',
			inputSchema: z.object({
				datasourceUid: z.string(),
				namespace: z.string(),
				metricName: z.string(),
			}),
			readOnly: true,
		},
		({ datasourceUid, namespace, metricName }) =>
			ctx.client.datasourceResourceRequest(datasourceUid, '/dimensions', {
				method: 'POST',
				body: { namespace, metricName },
			}),
	);
}
