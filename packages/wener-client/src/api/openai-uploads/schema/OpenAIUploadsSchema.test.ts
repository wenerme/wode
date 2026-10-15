import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, test } from 'vitest';
import {
	OpenAIMD5Schema,
	OpenAIUploadPartFileSchema,
	OpenAIUploadPartSchema,
	OpenAIUploadSchema,
	OpenAIUploadsAddPartRequestSchema,
	OpenAIUploadsAddPartResponseSchema,
	OpenAIUploadsCancelRequestSchema,
	OpenAIUploadsCancelResponseSchema,
	OpenAIUploadsCompleteRequestSchema,
	OpenAIUploadsCompleteResponseSchema,
	OpenAIUploadsCreateRequestSchema,
	OpenAIUploadsCreateResponseSchema,
} from './index';

describe('OpenAI Uploads schemas', () => {
	test('解析 create JSON 和 upload response', () => {
		const request = OpenAIUploadsCreateRequestSchema.parse({
			bytes: 6,
			filename: 'joined.txt',
			mime_type: 'text/plain',
			purpose: 'assistants',
			expires_after: { anchor: 'created_at', seconds: 7200 },
		});
		expect(request).toMatchObject({ bytes: 6, purpose: 'assistants', expires_after: { seconds: 7200 } });
		expect(
			OpenAIUploadsCreateResponseSchema.parse({
				object: 'upload',
				id: 'upload_1',
				bytes: 6,
				created_at: 1,
				expires_at: 7201,
				filename: 'joined.txt',
				purpose: 'assistants',
				status: 'pending',
			}),
		).toMatchObject({ object: 'upload', id: 'upload_1', status: 'pending' });
	});

	test('解析 add part multipart 文件', () => {
		const data = new File(['part'], 'part.bin', { type: 'application/octet-stream' });
		const parsed = OpenAIUploadsAddPartRequestSchema.parse({ upload_id: 'upload_1', data });
		expect(parsed.data).toBe(data);
		const empty = new File([], 'empty.bin');
		expect(OpenAIUploadsAddPartRequestSchema.safeParse({ upload_id: 'upload_1', data: empty }).success).toBe(false);
		expect(
			OpenAIUploadPartSchema.parse({
				id: 'part_1',
				object: 'upload.part',
				created_at: 1,
				upload_id: 'upload_1',
				bytes: 4,
			}),
		).toMatchObject({ object: 'upload.part', bytes: 4 });
	});

	test('保留 zero-byte complete 的空 part_ids 和可选 MD5', () => {
		expect(OpenAIUploadsCompleteRequestSchema.parse({ upload_id: 'upload_1', part_ids: [], md5: '' })).toEqual({
			upload_id: 'upload_1',
			part_ids: [],
			md5: '',
		});
		expect(OpenAIUploadsCancelRequestSchema.parse({ upload_id: 'upload_1' })).toEqual({ upload_id: 'upload_1' });
		expect(OpenAIMD5Schema.parse('d41d8cd98f00b204e9800998ecf8427e')).toBe('d41d8cd98f00b204e9800998ecf8427e');
		expect(OpenAIMD5Schema.parse('1B2M2Y8AsgTpgAmY7PhCfg==')).toBe('1B2M2Y8AsgTpgAmY7PhCfg==');
		expect(OpenAIMD5Schema.parse('  ')).toBe('  ');
		expect(OpenAIMD5Schema.parse('not-md5')).toBe('not-md5');
		expect(OpenAIMD5Schema.safeParse(123).success).toBe(false);
		const rawBody = { part_ids: ['', 'part-1'], md5: 'plain string', extra: { keep: null } };
		expect(OpenAIUploadsCompleteRequestSchema.parse(rawBody)).toEqual(rawBody);
		expect(
			OpenAIUploadSchema.safeParse({
				object: 'upload',
				id: 'upload_1',
				bytes: 0,
				created_at: 1,
				expires_at: 2,
				filename: 'empty.txt',
				purpose: 'assistants',
				status: 'bogus',
			}).success,
		).toBe(false);
	});

	test('complete response 保留可选或可空嵌套 File', () => {
		const response = {
			object: 'upload',
			id: 'upload_1',
			bytes: 4,
			created_at: 1,
			expires_at: 7201,
			filename: 'joined.txt',
			purpose: 'assistants',
			status: 'completed',
			file: {
				id: 'file-1',
				object: 'file',
				bytes: 4,
				created_at: 1,
				filename: 'joined.txt',
				purpose: 'assistants',
				status: 'processed',
			},
		};
		expect(OpenAIUploadsCompleteResponseSchema.parse(response).file?.id).toBe('file-1');
		const { file, object, ...withoutFile } = response;
		expect(OpenAIUploadsCompleteResponseSchema.parse(withoutFile)).toEqual(withoutFile);
		expect(OpenAIUploadsCompleteResponseSchema.parse({ ...withoutFile, status: 'expired', file: null })).toEqual({
			...withoutFile,
			status: 'expired',
			file: null,
		});
		expect(OpenAIUploadsCompleteResponseSchema.parse({ ...response, file: { ...file, bytes: null } })).toEqual({
			...response,
			file: { ...file, bytes: null },
		});
	});

	test('OpenAPI/AJV 文档覆盖 Uploads 的 request 和 response schema', () => {
		const app = new OpenAPIHono();
		const uploadParams = z.strictObject({ upload_id: z.string().min(1) });
		app.openapi(
			createRoute({
				path: '/v1/uploads',
				method: 'post',
				request: {
					body: {
						required: true,
						content: { 'application/json': { schema: OpenAIUploadsCreateRequestSchema } },
					},
				},
				responses: {
					200: {
						description: 'created upload',
						content: { 'application/json': { schema: OpenAIUploadsCreateResponseSchema } },
					},
				},
			}),
			(c) => c.json({} as any, 200),
		);
		app.openapi(
			createRoute({
				path: '/v1/uploads/{upload_id}/parts',
				method: 'post',
				request: {
					params: uploadParams,
					body: {
						required: true,
						content: {
							'multipart/form-data': {
								schema: OpenAIUploadsAddPartRequestSchema.pick({ data: true }),
							},
						},
					},
				},
				responses: {
					200: {
						description: 'created upload part',
						content: { 'application/json': { schema: OpenAIUploadsAddPartResponseSchema } },
					},
				},
			}),
			(c) => c.json({} as any, 200),
		);
		app.openapi(
			createRoute({
				path: '/v1/uploads/{upload_id}/complete',
				method: 'post',
				request: {
					params: uploadParams,
					body: {
						required: true,
						content: {
							'application/json': {
								schema: OpenAIUploadsCompleteRequestSchema.omit({ upload_id: true }),
							},
						},
					},
				},
				responses: {
					200: {
						description: 'completed upload',
						content: { 'application/json': { schema: OpenAIUploadsCompleteResponseSchema } },
					},
				},
			}),
			(c) => c.json({} as any, 200),
		);
		app.openapi(
			createRoute({
				path: '/v1/uploads/{upload_id}/cancel',
				method: 'post',
				request: { params: uploadParams },
				responses: {
					200: {
						description: 'cancelled upload',
						content: { 'application/json': { schema: OpenAIUploadsCancelResponseSchema } },
					},
				},
			}),
			(c) => c.json({} as any, 200),
		);

		const document = app.getOpenAPI31Document({
			openapi: '3.1.1',
			info: { title: 'OpenAI Uploads', version: '1.0.0' },
		});
		const paths = document.paths as Record<string, any>;
		const createRequestSchema = paths['/v1/uploads'].post.requestBody.content['application/json'].schema;
		const addPartRequestSchema =
			paths['/v1/uploads/{upload_id}/parts'].post.requestBody.content['multipart/form-data'].schema;
		const completeRequestSchema =
			paths['/v1/uploads/{upload_id}/complete'].post.requestBody.content['application/json'].schema;
		const responseSchemas = [
			paths['/v1/uploads'].post.responses['200'].content['application/json'].schema,
			paths['/v1/uploads/{upload_id}/parts'].post.responses['200'].content['application/json'].schema,
			paths['/v1/uploads/{upload_id}/complete'].post.responses['200'].content['application/json'].schema,
			paths['/v1/uploads/{upload_id}/cancel'].post.responses['200'].content['application/json'].schema,
		];
		const ajv = new Ajv2020({ strict: false, validateFormats: false, addUsedSchema: false });
		const validateCreate = ajv.compile(createRequestSchema);
		const validateAddPart = ajv.compile(addPartRequestSchema);
		const validateComplete = ajv.compile(completeRequestSchema);
		for (const schema of responseSchemas) expect(() => ajv.compile(schema)).not.toThrow();
		expect(validateCreate({ bytes: 0, filename: 'empty.txt', mime_type: 'text/plain', purpose: 'assistants' })).toBe(
			true,
		);
		expect(
			validateCreate({
				bytes: 4,
				filename: 'joined.txt',
				mime_type: 'text/plain',
				purpose: 'assistants',
				expires_after: { anchor: 'created_at', seconds: 3600 },
			}),
		).toBe(true);
		expect(
			validateCreate({
				bytes: 4,
				filename: 'joined.txt',
				mime_type: 'text/plain',
				purpose: 'assistants',
				expires_after: { anchor: 'created_at', seconds: 3599 },
			}),
		).toBe(false);
		expect(validateAddPart({ data: 'part' })).toBe(true);
		expect(validateAddPart({ data: '' })).toBe(false);
		expect(validateComplete({ part_ids: [] })).toBe(true);
		expect(validateComplete({ part_ids: [], md5: 'not-md5' })).toBe(true);
		expect(OpenAIUploadPartFileSchema.meta()).toMatchObject({ type: 'string', format: 'binary', minLength: 1 });
	});
});
