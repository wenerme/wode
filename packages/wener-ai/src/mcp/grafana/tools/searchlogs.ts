import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';
import { resolveTimeRange } from '../utils';

function escapeSqlString(value: string) {
	return value.replaceAll("'", "''");
}

export function registerSearchLogsTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'search_logs',
		{
			description: 'Search logs across Loki or SQL/ClickHouse datasources',
			inputSchema: z.object({
				datasourceUid: z.string(),
				query: z.string(),
				from: z.string().nullish(),
				to: z.string().nullish(),
				limit: z.number().int().min(1).max(1000).default(100),
			}),
			readOnly: true,
		},
		async ({ datasourceUid, query, from, to, limit }) => {
			const datasource = await ctx.client.getDatasource(datasourceUid);
			const type = String(datasource.type || '').toLowerCase();
			const range = resolveTimeRange({ from, to });

			if (type.includes('loki')) {
				return ctx.client.datasourceProxyRequest(datasourceUid, '/loki/api/v1/query_range', {
					params: {
						query,
						start: range.fromMs * 1_000_000,
						end: range.toMs * 1_000_000,
						limit,
						direction: 'backward',
					},
				});
			}

			if (type.includes('clickhouse') || type.includes('mysql') || type.includes('postgres')) {
				const timeColumn = type.includes('clickhouse') ? 'timestamp' : 'created_at';
				return ctx.client.queryDatasource({
					from: String(range.fromMs),
					to: String(range.toMs),
					queries: [
						{
							refId: 'A',
							datasource: { uid: datasourceUid, type: datasource.type },
							datasourceType: datasource.type,
							rawSql: `SELECT * FROM logs WHERE ${timeColumn} BETWEEN '${range.fromIso}' AND '${range.toIso}' AND message LIKE '%${escapeSqlString(query)}%' LIMIT ${limit}`,
							format: 'table',
							queryType: 'sql',
						},
					],
				});
			}

			throw new Error(`search_logs does not support datasource type ${datasource.type}`);
		},
	);
}
