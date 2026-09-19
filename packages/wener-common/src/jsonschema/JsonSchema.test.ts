import type { TObject } from '@sinclair/typebox';
import type { AnySchemaObject } from 'ajv';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { JsonSchema } from './JsonSchema';
import type { JsonSchemaDef } from './types';

describe('jsonschema', () => {
	it('should create from schema', () => {
		for (const [a, b] of [
			[{ type: 'string' }, ''],
			[{ type: 'number' }, 0],
			[{ type: 'number', default: 1 }, 1],
			[{ type: 'integer' }, 0],
			[{ type: 'array' }, []],
			[{ type: 'object' }, {}],
			[{ type: 'object', properties: { a: { type: 'string' } }, required: ['a'] }, { a: '' }],
		]) {
			expect(JsonSchema.create(a)).toEqual(b);
		}
	});

	it('should match typebox types', () => {
		expectTypeOf<TObject<{}>>().toExtend<JsonSchemaDef>();
	});

	it('should match ajv types', () => {
		expectTypeOf<AnySchemaObject>().toExtend<JsonSchemaDef>();
	});
});
