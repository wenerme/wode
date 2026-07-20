import { z } from 'zod';

export const ClickHouseQuerySchema = z.object({
	sql: z.string().describe('SQL query to execute'),
	limit: z
		.number()
		.int()
		.positive()
		.optional()
		.describe('Maximum number of rows to return (appended as LIMIT if not already present)'),
});

export const ListTablesSchema = z.object({
	database: z.string().optional().describe('Database name (defaults to the connected database)'),
});

export const DescribeTableSchema = z.object({
	table: z.string().describe('Table name'),
	database: z.string().optional().describe('Database name (defaults to the connected database)'),
});
