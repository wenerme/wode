import { type TSchema, Kind as TypeBoxKind } from '@sinclair/typebox';
import '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { ifPresent } from '@wener/utils';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import type { ZodType } from 'zod/v4';
import type { JsonSchemaDef } from '../jsonschema';
import type { SchemaOutput, TypeSchema } from './TypeSchema';

/*
https://github.com/react-hook-form/resolvers
https://github.com/decs/typeschema/tree/main/packages
*/

export function validate<S extends TypeSchema>(schema: S, data: unknown): ValidationResult<SchemaOutput<S>> {
	if (isZodSchema(schema)) {
		const result = schema.safeParse(data);
		if (result.success) {
			return {
				success: true,
				data: result.data as any,
			};
		}

		return {
			issues: result.error.issues.map(({ message, path, code }) => ({ message, path, code })),
			// message: z.prettifyError(result.error),
			success: false,
		};
	}

	if (isTypeBoxSchema(schema)) {
		const checker = TypeCompiler.Compile(schema);
		if (checker.Check(data)) {
			return {
				success: true,
				data: data as any,
			};
		}
		return {
			issues: Array.from(checker.Errors(data)).map(({ message, path }) => {
				return { message, path: [path] };
			}),
			// message: '',
			success: false,
		};
	}

	if (isJsonSchema(schema)) {
		const ajv = new Ajv({
			allErrors: true,
			validateSchema: true,
		});
		addFormats(ajv);
		const validator = ajv.compile(schema);
		if (validator(data)) {
			return {
				data: data as any,
				success: true,
			};
		}

		const issues =
			validator.errors?.map((error) => {
				const message = error.message || 'Unknown error';
				const path = error.instancePath
					.split('/')
					.filter(Boolean)
					.map((p) => p as PropertyKey);
				return { message, path };
			}) || [];
		return {
			success: false,
			// message: 'Invalid data',
			issues,
		};
	}

	return {
		success: false,
		// message: 'Invalid schema',
		issues: [
			{
				message: 'Unknown schema type',
			},
		],
	};
}

export function parseData<S extends TypeSchema>(schema: S, data: unknown): SchemaOutput<S> {
	let result = validate(schema, data);
	if (result.success) {
		return result.data;
	}
	throw Object.assign(
		new Error(
			result.issues
				.map((v) => {
					return `${ifPresent(v.path?.join(), (v) => `[${v}]`)}: ${v.message}`;
				})
				.join('; '),
		),
		{
			issues: result.issues,
		},
	);
}

function _formatIssues(_schema: TypeSchema, _issues: Array<ValidationIssue>): string {
	return '';
}

export function isZodSchema<I = any, O = any>(schema: any | TypeSchema<I, O>): schema is ZodType<O, I> {
	return typeof schema === 'object' && 'parse' in schema;
}

export function isTypeBoxSchema(schema: any): schema is TSchema {
	return typeof schema === 'object' && TypeBoxKind in schema;
}

export function isJsonSchema(schema: any): schema is JsonSchemaDef {
	let sc: JsonSchemaDef = schema;
	return typeof schema === 'object' && Boolean(sc.type || sc.properties || sc.anyOf || sc.oneOf || sc.$ref || sc.items);
}

export type ValidationIssue = {
	message: string;
	path?: Array<PropertyKey>;
	code?: string;
};

export type ValidationResult<TOutput> =
	| { success: true; data: TOutput }
	| { success: false; issues: Array<ValidationIssue> };
