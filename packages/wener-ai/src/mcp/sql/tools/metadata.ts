import { z } from 'zod';
import type { SqlContext } from '../server';
import { ListObjectsInputSchema, DescribeObjectInputSchema } from '../schemas';
import { getVersion, listObjects, describeObject } from '../utils';

export function registerMetadataTools(ctx: SqlContext) {
	const { server, getDb, textResult, jsonResult } = ctx;

	server.registerTool(
		'get_version',
		{
			description: 'Get database version information',
			inputSchema: z.object({}),
			annotations: { readOnlyHint: true },
		},
		async () => {
			try {
				const { db, dialect } = await getDb();
				return textResult(await getVersion(db, dialect));
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);

	server.registerTool(
		'list_objects',
		{
			description: 'List database objects (tables, views, etc.)',
			inputSchema: ListObjectsInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ type, schema }) => {
			try {
				const { db, dialect } = await getDb();
				return jsonResult(await listObjects(db, dialect, type, schema));
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);

	server.registerTool(
		'describe_object',
		{
			description: 'Get detailed information about a database object',
			inputSchema: DescribeObjectInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ name: objName, schema }) => {
			try {
				const { db, dialect } = await getDb();
				return jsonResult(await describeObject(db, dialect, objName, schema));
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : e}`);
			}
		},
	);
}
