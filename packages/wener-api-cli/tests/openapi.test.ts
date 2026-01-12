import { describe, expect, it } from 'vitest';
import { parseOpenApiSpec } from '../src/openapi';

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
