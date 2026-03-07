import { z } from 'zod';
import { DescribeTableSchema, ListTablesSchema } from '../schemas';
import type { ClickHouseContext } from '../server';

export function registerMetadataTools(ctx: ClickHouseContext) {
	const { server, getClient, textResult, jsonResult } = ctx;

	server.registerTool(
		'get_version',
		{
			description: 'Get ClickHouse server version and uptime',
			inputSchema: z.object({}),
			annotations: { readOnlyHint: true },
		},
		async () => {
			try {
				const client = await getClient();
				const result = await client.query({
					query: `SELECT version() AS version, uptime() AS uptime_seconds`,
					format: 'JSONEachRow',
				});
				const rows = (await result.json()) as Array<{ version: string; uptime_seconds: string }>;
				const row = rows[0];
				if (!row) return textResult('Unable to retrieve version');
				return textResult(`ClickHouse ${row.version} (uptime: ${row.uptime_seconds}s)`);
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);

	server.registerTool(
		'list_databases',
		{
			description: 'List all databases',
			inputSchema: z.object({}),
			annotations: { readOnlyHint: true },
		},
		async () => {
			try {
				const client = await getClient();
				const result = await client.query({
					query: `SELECT name, engine, comment FROM system.databases ORDER BY name`,
					format: 'JSONEachRow',
				});
				return jsonResult(await result.json());
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);

	server.registerTool(
		'list_tables',
		{
			description: 'List tables and views in a database with row counts and sizes',
			inputSchema: ListTablesSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ database }) => {
			try {
				const client = await getClient();
				const dbFilter = database ? `database = '${database}'` : `database = currentDatabase()`;
				const result = await client.query({
					query: `
						SELECT
							name, engine,
							formatReadableQuantity(total_rows) AS rows,
							formatReadableSize(total_bytes) AS size,
							comment
						FROM system.tables
						WHERE ${dbFilter}
						ORDER BY name
					`,
					format: 'JSONEachRow',
				});
				return jsonResult(await result.json());
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);

	server.registerTool(
		'describe_table',
		{
			description: 'Get detailed column information and table engine for a table',
			inputSchema: DescribeTableSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ table, database }) => {
			try {
				const client = await getClient();
				const dbFilter = database ? `database = '${database}'` : `database = currentDatabase()`;

				const colResult = await client.query({
					query: `
						SELECT
							name, type, default_kind, default_expression,
							comment, is_in_partition_key, is_in_sorting_key, is_in_primary_key
						FROM system.columns
						WHERE ${dbFilter} AND table = '${table}'
						ORDER BY position
					`,
					format: 'JSONEachRow',
				});

				const tableResult = await client.query({
					query: `
						SELECT engine, partition_key, sorting_key, primary_key, sampling_key,
						       formatReadableQuantity(total_rows) AS rows,
						       formatReadableSize(total_bytes) AS size
						FROM system.tables
						WHERE ${dbFilter} AND name = '${table}'
					`,
					format: 'JSONEachRow',
				});

				const columns = await colResult.json();
				const tableInfo = ((await tableResult.json()) as Record<string, unknown>[])[0];

				return jsonResult({ table: tableInfo, columns });
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);
}
