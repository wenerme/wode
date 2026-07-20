import { ClickHouseQuerySchema } from '../schemas';
import type { ClickHouseContext } from '../server';

export function registerQueryTools(ctx: ClickHouseContext) {
	const { server, readOnly, getClient, textResult, jsonResult } = ctx;

	server.registerTool(
		'query_json',
		{
			description: 'Execute a SELECT query and return results as JSON array',
			inputSchema: ClickHouseQuerySchema,
			annotations: { readOnlyHint: true },
		},
		async ({ sql, limit }) => {
			try {
				const client = await getClient();
				let query = sql;
				if (limit && !/\bLIMIT\b/i.test(query)) {
					query = `${query} LIMIT ${limit}`;
				}
				const result = await client.query({ query, format: 'JSONEachRow' });
				const rows = await result.json();
				return jsonResult(rows);
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);

	server.registerTool(
		'exec_query',
		{
			description: 'Execute a SELECT query and return formatted text result',
			inputSchema: ClickHouseQuerySchema,
			annotations: { readOnlyHint: true },
		},
		async ({ sql, limit }) => {
			try {
				const client = await getClient();
				let query = sql;
				if (limit && !/\bLIMIT\b/i.test(query)) {
					query = `${query} LIMIT ${limit}`;
				}
				const result = await client.query({ query, format: 'JSONEachRow' });
				const rows = (await result.json()) as Record<string, unknown>[];
				const { formatTable } = await import('../utils');
				return textResult(formatTable(rows));
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);

	if (!readOnly) {
		server.registerTool(
			'exec_sql',
			{
				description: 'Execute any SQL statement (DDL, DML, etc.)',
				inputSchema: ClickHouseQuerySchema.pick({ sql: true }),
			},
			async ({ sql }) => {
				try {
					const client = await getClient();
					const result = await client.query({ query: sql, format: 'JSONEachRow' });
					const rows = (await result.json()) as Record<string, unknown>[];
					if (rows.length > 0) {
						return jsonResult(rows);
					}
					return textResult('SQL executed successfully');
				} catch (e) {
					return textResult(`Error: ${e instanceof Error ? e.message : e}`);
				}
			},
		);
	}
}
