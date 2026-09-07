import { describe, expect, it } from 'vite-plus/test';
import { formatJsonSchema, formatToolSignature } from './formatJsonSchema';

describe('formatJsonSchema', () => {
	it('formats empty schema', () => {
		expect(formatJsonSchema({})).toBe('{}');
		expect(formatJsonSchema(null)).toBe('{}');
		expect(formatJsonSchema(undefined)).toBe('{}');
	});

	it('formats simple string property', () => {
		const schema = {
			type: 'object',
			properties: {
				name: { type: 'string' },
			},
			required: ['name'],
		};
		expect(formatJsonSchema(schema)).toBe('{name:string}');
	});

	it('formats optional properties', () => {
		const schema = {
			type: 'object',
			properties: {
				name: { type: 'string' },
				age: { type: 'number' },
			},
			required: ['name'],
		};
		expect(formatJsonSchema(schema)).toBe('{name:string, age?:number}');
	});

	it('formats array types', () => {
		const schema = {
			type: 'object',
			properties: {
				tags: { type: 'array', items: { type: 'string' } },
			},
		};
		expect(formatJsonSchema(schema)).toBe('{tags?:string[]}');
	});

	it('formats nested objects', () => {
		const schema = {
			type: 'object',
			properties: {
				user: {
					type: 'object',
					properties: {
						id: { type: 'string' },
					},
					required: ['id'],
				},
			},
		};
		expect(formatJsonSchema(schema)).toBe('{user?:{id:string}}');
	});

	it('formats enum types', () => {
		const schema = {
			type: 'object',
			properties: {
				status: { enum: ['active', 'inactive'] },
			},
		};
		expect(formatJsonSchema(schema)).toBe('{status?:"active"|"inactive"}');
	});

	it('formats string with format', () => {
		const schema = {
			type: 'object',
			properties: {
				email: { type: 'string', format: 'email' },
			},
		};
		expect(formatJsonSchema(schema)).toBe('{email?:string<email>}');
	});

	it('formats multiple types', () => {
		const schema = {
			type: 'object',
			properties: {
				value: { type: ['string', 'number'] },
			},
		};
		expect(formatJsonSchema(schema)).toBe('{value?:string|number}');
	});

	it('formats oneOf', () => {
		const schema = {
			type: 'object',
			properties: {
				data: {
					oneOf: [{ type: 'string' }, { type: 'number' }],
				},
			},
		};
		expect(formatJsonSchema(schema)).toBe('{data?:string|number}');
	});
});

describe('formatToolSignature', () => {
	it('formats tool with no params', () => {
		expect(formatToolSignature('get_status', {})).toBe('get_status');
	});

	it('formats tool with params', () => {
		const schema = {
			type: 'object',
			properties: {
				id: { type: 'string' },
			},
			required: ['id'],
		};
		expect(formatToolSignature('get_user', schema)).toBe('get_user {id:string}');
	});

	it('formats complex tool signature', () => {
		const schema = {
			type: 'object',
			properties: {
				query: { type: 'string' },
				limit: { type: 'number' },
				tags: { type: 'array', items: { type: 'string' } },
			},
			required: ['query'],
		};
		expect(formatToolSignature('search', schema)).toBe('search {query:string, limit?:number, tags?:string[]}');
	});
});
