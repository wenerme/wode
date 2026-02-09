import { sql } from 'kysely';
import type { SqlContext } from '../server';
import { SqlInputSchema } from '../schemas';
import { formatTable } from '../utils';

export function registerQueryTools(ctx: SqlContext) {
	const { server, getDb, textResult, jsonResult } = ctx;

	server.registerTool(
		'query_json',
		{
			description: 'Execute a SELECT query and return results as JSON array',
			inputSchema: SqlInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ sql: sqlStr }) => {
			try {
				const { db } = await getDb();
				const result = await sql.raw(sqlStr).execute(db);
				return jsonResult(result.rows);
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);

	server.registerTool(
		'exec_query',
		{
			description: 'Execute a SELECT query and return formatted text result',
			inputSchema: SqlInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ sql: sqlStr }) => {
			try {
				const { db } = await getDb();
				const result = await sql.raw(sqlStr).execute(db);
				return textResult(formatTable(result.rows));
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);

	server.registerTool(
		'exec_dml',
		{
			description: 'Execute DML statements (INSERT, UPDATE, DELETE)',
			inputSchema: SqlInputSchema,
		},
		async ({ sql: sqlStr }) => {
			try {
				const { db } = await getDb();
				const result = await sql.raw(sqlStr).execute(db);
				return textResult(`Affected rows: ${result.numAffectedRows ?? 0}`);
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);

	server.registerTool(
		'exec_ddl',
		{
			description: 'Execute DDL statements (CREATE, ALTER, DROP)',
			inputSchema: SqlInputSchema.pick({ sql: true }),
		},
		async ({ sql: sqlStr }) => {
			try {
				const { db } = await getDb();
				await sql.raw(sqlStr).execute(db);
				return textResult('DDL executed successfully');
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);

	server.registerTool(
		'exec_sql',
		{
			description: 'Execute any SQL statement',
			inputSchema: SqlInputSchema,
		},
		async ({ sql: sqlStr }) => {
			try {
				const { db } = await getDb();
				const result = await sql.raw(sqlStr).execute(db);
				if (result.rows && result.rows.length > 0) {
					return jsonResult(result.rows);
				}
				return textResult('SQL executed successfully');
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);
}
