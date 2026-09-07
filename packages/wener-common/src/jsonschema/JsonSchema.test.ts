import type { TObject } from '@sinclair/typebox';
import type { AnySchemaObject, JSONSchemaType } from 'ajv';
import { describe, expect, it } from 'vite-plus/test';
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
		let a: JsonSchemaDef | undefined;
		let b: TObject<{}> | undefined;
		a = b;
	});

	it('should match ajv types', () => {
		let a: JsonSchemaDef | undefined;
		let b: AnySchemaObject | undefined;
		let c: JSONSchemaType<{}> | undefined;
		a = b;
		// a = c;
	});
});
