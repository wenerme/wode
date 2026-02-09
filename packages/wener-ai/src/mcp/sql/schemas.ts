import { z } from 'zod';

export const SqlInputSchema = z.object({
	sql: z.string().describe('SQL statement'),
	params: z.array(z.unknown()).optional().describe('Query parameters'),
});

export const ListObjectsInputSchema = z.object({
	type: z.enum(['table', 'view', 'all']).default('all').describe('Type of objects to list'),
	schema: z.string().optional().describe('Schema/database name'),
});

export const DescribeObjectInputSchema = z.object({
	name: z.string().describe('Object name (table, view, etc.)'),
	schema: z.string().optional().describe('Schema/database name'),
});
