import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';
import { resolveTimeRange } from '../utils';

export function registerElasticSearchTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'query_elasticsearch',
		{
			description: 'Query an Elasticsearch datasource using Lucene or Query DSL',
			inputSchema: z.object({
				datasourceUid: z.string(),
				query: z.string().nullish().describe('Lucene query string'),
				queryDsl: z.record(z.string(), z.unknown()).nullish().describe('Elasticsearch query DSL'),
				timeField: z.string().default('@timestamp'),
				from: z.string().nullish(),
				to: z.string().nullish(),
				size: z.number().int().min(1).max(500).default(100),
			}),
			readOnly: true,
		},
		async ({ datasourceUid, query, queryDsl, timeField, from, to, size }) => {
			const range = resolveTimeRange({ from, to });
			const body = queryDsl ?? {
				query: {
					bool: {
						must: query ? [{ query_string: { query } }] : [],
						filter: [
							{
								range: {
									[timeField]: {
										gte: range.fromIso,
										lte: range.toIso,
									},
								},
							},
						],
					},
				},
				size,
				sort: [{ [timeField]: { order: 'desc' } }],
			};
			return ctx.client.datasourceProxyRequest(datasourceUid, '/_search', {
				method: 'POST',
				body,
			});
		},
	);
}
