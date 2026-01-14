import { match, P } from 'ts-pattern';
import type { JsonSchemaDef } from '../jsonschema';
import { toJsonSchema } from './toJsonSchema';
import type { SchemaOutput, TypeSchema } from './TypeSchema';

export function createSchemaData<S extends TypeSchema>(
	ts: S,
	options: CreateSchemaDataOptions = {},
): Partial<SchemaOutput<S>> {
	const schema = toJsonSchema(ts);
	return createJsonSchemaData(schema, options);
}

type CreateSchemaDataOptions = Partial<CreateOptions> & {
	all?: boolean;
};

function createJsonSchemaData(schema: JsonSchemaDef, options: CreateSchemaDataOptions): any {
	let skip: CreateOptions['skip'] = (s, ctx) => Boolean(!ctx.required && s.nullable);
	if (options.all) {
		skip = () => false;
	}
	if (options.skip) {
		skip = options.skip;
	}
	return _create(
		schema,
		{
			skip,
		},
		{ required: false },
	);
}

type CreateOptions = {
	skip: (schema: JsonSchemaDef, ctx: { required: boolean }) => boolean;
};

function _create(schema: JsonSchemaDef, options: CreateOptions, ctx: { required: boolean }): any {
	const { skip } = options;
	if (skip(schema, ctx)) {
		return schema.default;
	}
	if (schema.default !== undefined) {
		return schema.default;
	}
	return match(schema as JsonSchemaDef)
		.returnType<any>()
		.with({ default: P.select() }, (v) => v)
		.with({ const: P.nonNullable }, (v) => v.const)
		.with({ anyOf: P.nonNullable }, (schema) => {
			return _create(schema.anyOf[0], options, { required: false });
		})
		.with({ oneOf: P.nonNullable }, (schema) => {
			return _create(schema.oneOf[0], options, { required: false });
		})
		.with({ type: 'string' }, (_schema) => '')
		.with({ type: P.union('number', 'integer') }, (_schema) => 0)
		.with({ type: 'object' }, () => {
			const out: Record<string, any> = {};

			let required = Array.isArray(schema.required) ? schema.required : [];
			for (const [k, v] of Object.entries(schema.properties || {}) as [string, JsonSchemaDef][]) {
				const value = _create(v, options, {
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
		.with({ type: 'boolean' }, (_schema) => false)
		.with({ type: 'array' }, (_schema) => [])
		.otherwise(() => {
			return undefined;
		});
}
