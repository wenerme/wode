import { describe, expect, it } from 'vitest';
import { filterOperations, parseOpenApiSpec } from '../src/openapi';
import type { ParsedOperation } from '../src/schema';

describe('parseOpenApiSpec', () => {
	it('should parse OpenAPI 3.0 spec', () => {
		const spec = {
			openapi: '3.0.1',
			info: {
				title: 'Test API',
				version: '1.0.0',
			},
			paths: {
				'/pet/{petId}': {
					get: {
						operationId: 'getPetById',
						summary: 'Get pet by ID',
						parameters: [
							{
								name: 'petId',
								in: 'path',
								required: true,
								schema: { type: 'integer' },
							},
						],
						responses: {
							'200': {
								description: 'Success',
							},
						},
					},
				},
			},
		};

		const parsed = parseOpenApiSpec(JSON.stringify(spec));

		expect(parsed.info.title).toBe('Test API');
		expect(parsed.info.version).toBe('1.0.0');
		expect(parsed.operations).toHaveLength(1);
		expect(parsed.operations[0].operationId).toBe('getPetById');
		expect(parsed.operations[0].method).toBe('GET');
		expect(parsed.operations[0].path).toBe('/pet/{petId}');
		expect(parsed.operations[0].parameters).toHaveLength(1);
		expect(parsed.operations[0].parameters[0].name).toBe('petId');
		expect(parsed.operations[0].parameters[0].in).toBe('path');
		expect(parsed.operations[0].parameters[0].required).toBe(true);
	});

	it('should generate operationId if not present', () => {
		const spec = {
			openapi: '3.0.0',
			info: { title: 'Test', version: '1.0' },
			paths: {
				'/users': {
					get: {
						responses: { '200': { description: 'OK' } },
					},
				},
			},
		};

		const parsed = parseOpenApiSpec(JSON.stringify(spec));

		expect(parsed.operations[0].operationId).toBe('GET__users');
	});

	it('should parse request body', () => {
		const spec = {
			openapi: '3.0.0',
			info: { title: 'Test', version: '1.0' },
			paths: {
				'/pet': {
					post: {
						operationId: 'addPet',
						requestBody: {
							required: true,
							content: {
								'application/json': {
									schema: {
										type: 'object',
										properties: {
											name: { type: 'string' },
										},
									},
								},
							},
						},
						responses: { '200': { description: 'OK' } },
					},
				},
			},
		};

		const parsed = parseOpenApiSpec(JSON.stringify(spec));

		expect(parsed.operations[0].requestBody).toBeDefined();
		expect(parsed.operations[0].requestBody?.required).toBe(true);
		expect(parsed.operations[0].requestBody?.contentType).toBe('application/json');
	});
});

describe('filterOperations', () => {
	const operations: ParsedOperation[] = [
		{
			operationId: 'getPetById',
			method: 'GET',
			path: '/pet/{petId}',
			tags: ['pet'],
			parameters: [],
			responses: {},
		},
		{
			operationId: 'addPet',
			method: 'POST',
			path: '/pet',
			tags: ['pet'],
			parameters: [],
			responses: {},
		},
		{
			operationId: 'uploadFile',
			method: 'POST',
			path: '/pet/{petId}/uploadImage',
			tags: ['pet'],
			parameters: [],
			responses: {},
		},
		{
			operationId: 'getInventory',
			method: 'GET',
			path: '/store/inventory',
			tags: ['store'],
			parameters: [],
			responses: {},
		},
		{
			operationId: 'createUser',
			method: 'POST',
			path: '/user',
			tags: ['user'],
			parameters: [],
			responses: {},
		},
	];

	it('should filter by include pattern on operationId', () => {
		const filtered = filterOperations(operations, ['*pet*']);
		expect(filtered).toHaveLength(3);
		expect(filtered.map((op) => op.operationId)).toEqual(['getPetById', 'addPet', 'uploadFile']);
	});

	it('should filter by exclude pattern', () => {
		const filtered = filterOperations(operations, null, ['*upload*']);
		expect(filtered).toHaveLength(4);
		expect(filtered.map((op) => op.operationId)).not.toContain('uploadFile');
	});

	it('should apply both include and exclude (exclude takes priority)', () => {
		const filtered = filterOperations(operations, ['*pet*'], ['*upload*']);
		expect(filtered).toHaveLength(2);
		expect(filtered.map((op) => op.operationId)).toEqual(['getPetById', 'addPet']);
	});

	it('should filter by tag', () => {
		const filtered = filterOperations(operations, ['store']);
		expect(filtered).toHaveLength(1);
		expect(filtered[0].operationId).toBe('getInventory');
	});

	it('should filter by path pattern', () => {
		const filtered = filterOperations(operations, ['/pet/**']);
		expect(filtered).toHaveLength(3);
	});

	it('should return all operations when no filter specified', () => {
		const filtered = filterOperations(operations, null, null);
		expect(filtered).toHaveLength(5);
	});
});
