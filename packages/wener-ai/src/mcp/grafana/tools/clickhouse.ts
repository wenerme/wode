import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';
import { queryDatasource, requireDatasource } from './query-helpers';

async function runClickHouseSql(ctx: GrafanaContext, datasourceUid: string, rawSql: string) {
	const datasource = await requireDatasource(ctx, datasourceUid);
	return queryDatasource(ctx, {
		datasourceUid,
		queries: [
			{
				datasourceType: datasource.type,
				rawSql,
				format: 'table',
				queryType: 'sql',
			},
		],
	});
}

export function registerClickHouseTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'query_clickhouse',
		{
			description: 'Execute a ClickHouse SQL query through Grafana',
			inputSchema: z.object({
				datasourceUid: z.string(),
				query: z.string(),
			}),
			readOnly: true,
		},
		({ datasourceUid, query }) => runClickHouseSql(ctx, datasourceUid, query),
	);

	registerJsonTool(
		ctx,
		'list_clickhouse_tables',
		{
			description: 'List ClickHouse tables',
			inputSchema: z.object({
				datasourceUid: z.string(),
				database: z.string().default('default'),
			}),
			readOnly: true,
		},
		({ datasourceUid, database }) =>
			runClickHouseSql(
				ctx,
				datasourceUid,
				`SELECT database, name, engine, total_rows FROM system.tables WHERE database = '${database}' ORDER BY name`,
			),
	);

	registerJsonTool(
		ctx,
		'describe_clickhouse_table',
		{
			description: 'Describe a ClickHouse table schema',
			inputSchema: z.object({
				datasourceUid: z.string(),
				table: z.string(),
				database: z.string().default('default'),
			}),
			readOnly: true,
		},
		({ datasourceUid, table, database }) => runClickHouseSql(ctx, datasourceUid, `DESCRIBE TABLE ${database}.${table}`),
	);
}
