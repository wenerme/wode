import type {
	TSchema,
	StaticDecode as TypeBoxStaticDecode,
	StaticEncode as TypeBoxStaticEncode,
} from '@sinclair/typebox';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { z } from 'zod';
import type { JsonSchemaDef } from '../jsonschema';

export type TypeSchema<I = unknown, O = I> = TSchema | z.ZodSchema<O, I> | JsonSchemaDef | StandardSchemaV1<I, O>;

export type SchemaOutput<S extends TypeSchema> =
	S extends StandardSchemaV1<infer I, infer O>
		? O
		: S extends z.ZodSchema<infer O, infer I>
			? O
			: S extends TSchema
				? TypeBoxStaticEncode<S>
				: S extends JsonSchemaDef<infer I, infer O>
					? O
					: never;

export type SchemaInput<S extends TypeSchema> =
	S extends StandardSchemaV1<infer I, infer O>
		? I
		: S extends z.ZodSchema<infer O, infer I>
			? I
			: S extends TSchema
				? TypeBoxStaticDecode<S>
				: S extends JsonSchemaDef<infer I, infer O>
					? I
					: never;
