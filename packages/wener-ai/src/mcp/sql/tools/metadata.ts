import { z } from 'zod';
import { DescribeObjectInputSchema, ListObjectsInputSchema } from '../schemas';
import type { SqlContext } from '../server';
import { describeObject, getVersion, listObjects } from '../utils';
import { describeSqlToolError } from './queryError';

export function registerMetadataTools(ctx: SqlContext) {
	const { server, getDb, textResult, jsonResult, describeQueryError } = ctx;
	/** 元数据工具的错误文案：有宿主摘要（脱敏、限长）时用摘要，没有时保持原有的 `Error: <原文>`。 */
	const metadataError = (e: unknown) =>
		textResult(`Error: ${describeSqlToolError(e, describeQueryError) ?? (e instanceof Error ? e.message : e)}`);

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
				return metadataError(e);
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
				return metadataError(e);
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
				return metadataError(e);
			}
		},
	);
}
