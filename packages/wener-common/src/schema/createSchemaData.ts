import { match, P } from 'ts-pattern';
import type { JsonSchemaDef } from '../jsonschema';
import { toJsonSchema } from './toJsonSchema';
import type { SchemaOutput, TypeSchema } from './TypeSchema';

export function createSchemaData<S extends TypeSchema>(
	ts: S,
	options: {
		required?: boolean;
	} = {},
): Partial<SchemaOutput<S>> {
	const schema = toJsonSchema(ts);
	return _createSchemaData(schema, options);
}

function _createSchemaData(
	schema: JsonSchemaDef,
	options: {
		required?: boolean;
	},
): any {
	if (!options.required && schema.nullable) {
		return schema.default;
	}
	if (schema.default !== undefined) {
		return schema.default;
	}
	return match(schema as JsonSchemaDef)
		.returnType<any>()
		.with({ default: P.select() }, (v) => v)
		.with({ const: P.nonNullable }, (v) => v)
		.with({ anyOf: P.nonNullable }, (schema) => {
			return _createSchemaData(schema.anyOf[0], options);
		})
		.with({ oneOf: P.nonNullable }, (schema) => {
			return _createSchemaData(schema.oneOf[0], options);
		})
		.with({ type: 'string' }, (schema) => '')
		.with({ type: P.union('number', 'integer') }, (schema) => 0)
		.with({ type: 'object' }, (schema) => {
			const out: Record<string, any> = {};

			let required = schema.required || [];
			for (const [k, v] of Object.entries(schema.properties || {}) as [string, JsonSchemaDef][]) {
				const value = createSchemaData(v, {
					...options,
					required: required.includes(k),
				});
				if (value === undefined) {
					continue;
				}
				out[k] = value;
			}

			return out;
		})
		.with({ type: 'null' }, () => null)
		.with({ type: 'boolean' }, (schema) => false)
		.with({ type: 'array' }, (schema) => [])
		.otherwise(() => {
			return undefined;
		});
}
