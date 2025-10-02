import type { TextContent, Tool } from '@modelcontextprotocol/sdk/types.js';
import consola from 'consola';
import { z } from 'zod/v4';
import { getMssqlConfig, isReadOnlyQuery } from './server/config';
import type { ConnectionPool } from './server/connection';

const logger = consola.withTag('mssql-tools');

// Zod schema for SQL query execution
const ExecuteSqlInputSchema = z.object({
	query: z.string().min(1).describe('The SQL query to execute'),
});

// Zod schema for version check
const GetVersionInputSchema = z.object({});

export const MssqlTools = {
	getToolDefinitions(): Tool[] {
		return [
			{
				name: 'exec_sql_csv',
				description: 'Execute an SQL query on the SQL Server and return results in CSV format',
				inputSchema: z.toJSONSchema(ExecuteSqlInputSchema) as any,
			},
			{
				name: 'exec_sql_json',
				description: 'Execute an SQL query on the SQL Server and return results in JSON format',
				inputSchema: z.toJSONSchema(ExecuteSqlInputSchema) as any,
			},
			{
				name: 'get_version',
				description: 'Get the SQL Server version information',
				inputSchema: z.toJSONSchema(GetVersionInputSchema) as any,
				annotations: {
					readOnlyHint: true,
				},
			},
		];
	},

	async handleTool(name: string, args: any, pool: ConnectionPool): Promise<{ content: TextContent[] }> {
		if (name === 'get_version') {
			return this.handleGetVersion(pool);
		}

		if (name === 'exec_sql_csv' || name === 'exec_sql_json') {
			const format = name === 'exec_sql_csv' ? 'csv' : 'json';
			return this.handleExecuteSql(args, pool, format);
		}

		throw new Error(`Unknown tool: ${name}`);
	},

	async handleGetVersion(pool: ConnectionPool): Promise<{ content: TextContent[] }> {
		try {
			const results = await pool.query('SELECT @@VERSION AS version');
			const version = results[0]?.version || 'Unknown';

			return {
				content: [
					{
						type: 'text',
						text: version,
					},
				],
			};
		} catch (error) {
			if (consola.level >= 0) {
				logger.error('Error getting SQL Server version:', error);
			}
			return {
				content: [
					{
						type: 'text',
						text: `Error getting version: ${error instanceof Error ? error.message : 'Unknown error'}`,
					},
				],
			};
		}
	},

	async handleExecuteSql(args: any, pool: ConnectionPool, format: 'csv' | 'json'): Promise<{ content: TextContent[] }> {
		// Validate input using Zod schema
		try {
			const validatedArgs = ExecuteSqlInputSchema.parse(args);
			const query = validatedArgs.query;

			// Get config to check access mode
			const config = getMssqlConfig();
			const useReadOnlyTransaction = config.accessMode === 'readonly';

			// In readonly mode, also validate query type as additional safety (pre-check before database execution)
			if (useReadOnlyTransaction && !isReadOnlyQuery(query)) {
				return {
					content: [
						{
							type: 'text',
							text: 'Error: Write operations are not allowed in read-only mode. Only SELECT, WITH, SHOW, DESCRIBE, EXPLAIN, and DESC queries are permitted. This query was blocked before execution.',
						},
					],
				};
			}

			// Only log if not in STDIO mode
			if (consola.level >= 0) {
				const mode = useReadOnlyTransaction ? 'readonly' : 'transactional';
				logger.info(
					`Executing SQL query (${format}, ${mode}): ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`,
				);
			}

			try {
				// Use different execution paths based on access mode
				const results = useReadOnlyTransaction
					? await pool.query(query) // Simple query execution for read-only
					: await pool.queryWithTransaction(query, false); // Transaction for write operations

				// Handle empty results
				if (!results || results.length === 0) {
					const message = query.trim().toUpperCase().startsWith('SELECT')
						? 'No results found'
						: 'Query executed successfully but returned no results.';

					return {
						content: [
							{
								type: 'text',
								text: message,
							},
						],
					};
				}

				// Format results based on requested format
				if (format === 'json') {
					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(results, null, 2),
							},
						],
					};
				} else {
					// CSV format
					const columns = Object.keys(results[0]);
					const csvRows = results.map((row: any) =>
						columns
							.map((col) => {
								const value = row[col];
								if (value === null || value === undefined) return '';
								if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
									return `"${value.replace(/"/g, '""')}"`;
								}
								return String(value);
							})
							.join(','),
					);
					const resultText = [columns.join(','), ...csvRows].join('\n');

					return {
						content: [
							{
								type: 'text',
								text: resultText,
							},
						],
					};
				}
			} catch (error) {
				if (consola.level >= 0) {
					logger.error(`Error executing SQL '${query}':`, error);
				}

				// Provide more specific error messages for read-only violations
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				const isReadOnlyError =
					errorMessage.toLowerCase().includes('read only')
					|| errorMessage.toLowerCase().includes('cannot execute')
					|| errorMessage.toLowerCase().includes('not allowed');

				if (useReadOnlyTransaction && isReadOnlyError) {
					return {
						content: [
							{
								type: 'text',
								text: `Error: Write operation blocked by read-only transaction. This query attempted to modify data, which is not allowed in read-only mode. Original error: ${errorMessage}`,
							},
						],
					};
				}

				return {
					content: [
						{
							type: 'text',
							text: `Error executing query: ${errorMessage}`,
						},
					],
				};
			}
		} catch (validationError) {
			if (consola.level >= 0) {
				logger.error('Invalid input arguments:', validationError);
			}
			return {
				content: [
					{
						type: 'text',
						text: `Invalid arguments: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`,
					},
				],
			};
		}
	},
};
