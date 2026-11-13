import { z } from 'zod';

export const SqlInputSchema = z.object({
	sql: z.string().describe('SQL statement'),
	params: z.array(z.unknown()).optional().describe('Query parameters'),
});

/** 只读查询工具的入参：结果上限只能调小（服务端上限见 `CreateSqlMcpServerOptions.resultLimits`）。 */
export const SqlQueryInputSchema = SqlInputSchema.extend({
	maxRows: z
		.number()
		.int()
		.positive()
		.optional()
		.describe('Max rows to return (capped by the server limit, default 10000). Prefer LIMIT or aggregation.'),
	maxResultBytes: z
		.number()
		.int()
		.positive()
		.optional()
		.describe('Max serialized result size in bytes (capped by the server limit, default 8 MiB).'),
});

export const ListObjectsInputSchema = z.object({
	type: z.enum(['table', 'view', 'all']).default('all').describe('Type of objects to list'),
	schema: z.string().optional().describe('Schema/database name'),
});

export const DescribeObjectInputSchema = z.object({
	name: z.string().describe('Object name (table, view, etc.)'),
	schema: z.string().optional().describe('Schema/database name'),
});
