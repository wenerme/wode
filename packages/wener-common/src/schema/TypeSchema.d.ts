import type {
  StaticDecode as TypeBoxStaticDecode,
  StaticEncode as TypeBoxStaticEncode,
  TSchema,
} from '@sinclair/typebox';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { JsonSchemaDef } from '@wener/common/jsonschema';
import type { z } from 'zod';

export type TypeSchema<I = unknown, O = I> = TSchema | z.ZodSchema<O, I> | JsonSchemaDef | StandardSchemaV1<I, O>;

export type SchemaOutput<S extends TypeSchema> =
  S extends StandardSchemaV1<infer I, infer O>
    ? O
    : S extends z.ZodSchema<infer O, infer I>
      ? O
      : S extends TSchema
        ? TypeBoxStaticEncode<S>
        : S extends JsonSchemaDef
          ? unknown
          : never;

export type SchemaInput<S extends TypeSchema> =
  S extends StandardSchemaV1<infer I, infer O>
    ? I
    : S extends z.ZodSchema<infer O, infer I>
      ? I
      : S extends TSchema
        ? TypeBoxStaticDecode<S>
        : S extends JsonSchemaDef
          ? unknown
          : never;
