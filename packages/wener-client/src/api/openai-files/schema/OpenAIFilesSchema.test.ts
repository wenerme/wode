import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, test } from 'vitest';
import {
	OpenAIFileSchema,
	OpenAIFilesContentRequestSchema,
	OpenAIFilesContentResponseSchema,
	OpenAIFilesCreateRequestSchema,
	OpenAIFilesCreateResponseSchema,
	OpenAIFilesDeleteRequestSchema,
	OpenAIFilesDeleteResponseSchema,
	OpenAIFilesListRequestSchema,
	OpenAIFilesListResponseSchema,
	OpenAIFilesRetrieveRequestSchema,
} from './index';

describe('OpenAI Files schemas', () => {
	test('保留可空 bytes、普通列表 object 和未知字段', () => {
		const file = {
			id: '',
			object: 'file',
			bytes: null,
			created_at: 1,
			filename: '',
			purpose: 'user_data',
			status: 'processed',
			extra: { keep: [null] },
		};
		expect(OpenAIFileSchema.parse(file)).toEqual(file);
		const list = { object: '', data: [file], has_more: false, first_id: '', last_id: '', extra: true };
		expect(OpenAIFilesListResponseSchema.parse(list)).toEqual(list);
		expect(OpenAIFileSchema.safeParse({ ...file, bytes: '1' }).success).toBe(false);
		expect(OpenAIFilesListResponseSchema.safeParse({ ...list, object: 1 }).success).toBe(false);
	});

	test('解析列表 query 和分页响应', () => {
		expect(
			OpenAIFilesListRequestSchema.parse({ purpose: 'assistants', limit: '100', after: 'file-1', order: 'desc' }),
		).toMatchObject({ purpose: 'assistants', limit: 100, after: 'file-1', order: 'desc' });
		expect(
			OpenAIFilesListResponseSchema.parse({
				object: 'list',
				data: [
					{
						id: 'file-1',
						object: 'file',
						bytes: 3,
						created_at: 1,
						filename: 'sample.txt',
						purpose: 'assistants',
						status: 'processed',
					},
				],
				has_more: false,
				first_id: 'file-1',
				last_id: 'file-1',
			}),
		).toMatchObject({ object: 'list', data: [{ id: 'file-1' }], has_more: false });
	});

	test('解析 create multipart 文件和 bracket expires_after 字段', () => {
		const file = new File(['hello'], 'sample.txt', { type: 'text/plain' });
		const parsed = OpenAIFilesCreateRequestSchema.parse({
			file,
			purpose: 'assistants',
			'expires_after[anchor]': 'created_at',
			'expires_after[seconds]': '3600',
		});
		expect(parsed.file).toBe(file);
		expect(parsed['expires_after[seconds]']).toBe(3600);
		expect(
			OpenAIFilesCreateRequestSchema.safeParse({ file, purpose: 'assistants', 'expires_after[seconds]': '3600' }),
		).toMatchObject({ success: false });
		expect(
			OpenAIFilesCreateRequestSchema.safeParse({
				file,
				purpose: 'assistants',
				'expires_after[anchor]': 'created_at',
			}),
		).toMatchObject({ success: false });
	});

	test('只接受服务端兼容的十进制 limit 文本', () => {
		expect(OpenAIFilesListRequestSchema.parse({ limit: '100' }).limit).toBe(100);
		expect(OpenAIFilesListRequestSchema.parse({ limit: ' 1 ' }).limit).toBe(1);
		expect(OpenAIFilesListRequestSchema.parse({ limit: '10000' }).limit).toBe(10_000);
		expect(OpenAIFilesListRequestSchema.safeParse({ limit: '1e2' }).success).toBe(false);
		expect(OpenAIFilesListRequestSchema.safeParse({ limit: '0x10' }).success).toBe(false);
		expect(OpenAIFilesListRequestSchema.safeParse({ limit: '0' }).success).toBe(false);
		expect(OpenAIFilesListRequestSchema.safeParse({ limit: '10001' }).success).toBe(false);
	});

	test('直接 File 接受空 multipart 文件，响应状态与分页游标兼容OpenAI', () => {
		const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
		expect(OpenAIFilesCreateRequestSchema.safeParse({ file: emptyFile, purpose: 'assistants' }).success).toBe(true);
		expect(
			OpenAIFileSchema.safeParse({
				id: 'file-1',
				object: 'file',
				bytes: 1,
				created_at: 1,
				filename: 'sample.txt',
				purpose: 'assistants',
				status: 'bogus',
			}).success,
		).toBe(false);
		expect(OpenAIFilesListResponseSchema.parse({ object: 'list', data: [], has_more: false })).toEqual({
			object: 'list',
			data: [],
			has_more: false,
		});
	});

	test('解析 path operation 和 delete response', () => {
		expect(OpenAIFilesRetrieveRequestSchema.parse({ file_id: 'file-1' })).toEqual({ file_id: 'file-1' });
		expect(OpenAIFilesDeleteRequestSchema.parse({ file_id: 'file-1' })).toEqual({ file_id: 'file-1' });
		expect(OpenAIFilesDeleteResponseSchema.parse({ id: 'file-1', object: 'file', deleted: true })).toEqual({
			id: 'file-1',
			object: 'file',
			deleted: true,
		});
	});

	test('将文件内容响应声明为 binary', () => {
		expect(OpenAIFilesContentRequestSchema.parse({ file_id: 'file-1' })).toEqual({ file_id: 'file-1' });
		expect(OpenAIFilesContentResponseSchema.parse('raw content')).toBe('raw content');
		expect(OpenAIFilesContentResponseSchema.meta()).toMatchObject({ type: 'string', format: 'binary' });
	});

	test('OpenAPI 文档保留 multipart 和内容响应的 binary 格式', () => {
		const app = new OpenAPIHono();
		app.openapi(
			createRoute({
				path: '/v1/files',
				method: 'get',
				request: { query: OpenAIFilesListRequestSchema },
				responses: {
					200: {
						description: 'file list',
						content: { 'application/json': { schema: OpenAIFilesListResponseSchema } },
					},
				},
			}),
			(c) => c.json({ object: 'list' as const, data: [], has_more: false }, 200),
		);
		app.openapi(
			createRoute({
				path: '/v1/files',
				method: 'post',
				request: {
					body: {
						required: true,
						content: { 'multipart/form-data': { schema: OpenAIFilesCreateRequestSchema } },
					},
				},
				responses: {
					200: {
						description: 'created file',
						content: { 'application/json': { schema: OpenAIFilesCreateResponseSchema } },
					},
				},
			}),
			(c) =>
				c.json(
					{
						id: 'file-1',
						object: 'file' as const,
						bytes: 0,
						created_at: 1,
						filename: 'empty.txt',
						purpose: 'assistants',
						status: 'processed' as const,
					},
					200,
				),
		);
		app.openapi(
			createRoute({
				path: '/v1/files/{file_id}/content',
				method: 'get',
				request: { params: OpenAIFilesContentRequestSchema },
				responses: {
					200: {
						description: 'file content',
						content: { 'application/octet-stream': { schema: OpenAIFilesContentResponseSchema } },
					},
				},
			}),
			() => new Response('content'),
		);

		const document = app.getOpenAPI31Document({
			openapi: '3.1.1',
			info: { title: 'OpenAI Files', version: '1.0.0' },
		});
		const paths = document.paths as Record<string, any>;
		const listParameters = paths['/v1/files'].get.parameters as Array<Record<string, any>>;
		const createSchema = paths['/v1/files'].post.requestBody.content['multipart/form-data'].schema;
		const limitParameter = listParameters.find((parameter) => parameter.name === 'limit');
		expect(limitParameter).toBeDefined();
		const limitSchema = limitParameter?.schema;
		const contentSchema =
			paths['/v1/files/{file_id}/content'].get.responses['200'].content['application/octet-stream'].schema;
		expect(JSON.stringify(createSchema)).toContain('"format":"binary"');
		expect(JSON.stringify(createSchema)).toContain('"minimum":3600');
		expect(JSON.stringify(createSchema)).toContain('"maximum":2592000');
		expect(JSON.stringify(createSchema)).not.toContain('/u');
		expect(JSON.stringify(limitSchema)).toContain('"minimum":1');
		expect(JSON.stringify(limitSchema)).toContain('"maximum":10000');
		expect(JSON.stringify(limitSchema)).not.toContain('/u');
		const ajv = new Ajv2020({ strict: false, validateFormats: false, addUsedSchema: false });
		const validateLimit = ajv.compile(limitSchema);
		expect(validateLimit(1)).toBe(true);
		expect(validateLimit('10000')).toBe(true);
		expect(validateLimit(' 1 ')).toBe(true);
		expect(validateLimit(0)).toBe(false);
		expect(validateLimit('10001')).toBe(false);
		expect(validateLimit('1e2')).toBe(false);
		expect(validateLimit('0x10')).toBe(false);
		const validateCreate = ajv.compile(createSchema);
		expect(validateCreate({ file: 'content', purpose: 'assistants' })).toBe(true);
		expect(
			validateCreate({
				file: 'content',
				purpose: 'assistants',
				'expires_after[anchor]': 'created_at',
				'expires_after[seconds]': '3600',
			}),
		).toBe(true);
		expect(
			validateCreate({
				file: 'content',
				purpose: 'assistants',
				'expires_after[anchor]': 'created_at',
				'expires_after[seconds]': ' 3600 ',
			}),
		).toBe(true);
		expect(validateCreate({ file: 'content', purpose: 'assistants', 'expires_after[seconds]': '3600' })).toBe(false);
		expect(validateCreate({ file: 'content', purpose: 'assistants', 'expires_after[seconds]': '1e2' })).toBe(false);
		expect(contentSchema).toMatchObject({ type: 'string', format: 'binary' });
	});
});
