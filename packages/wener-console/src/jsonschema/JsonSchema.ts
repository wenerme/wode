import type { Static, TSchema } from '@sinclair/typebox';
import Ajv, { type ErrorObject, type Options } from 'ajv';
import addFormats from 'ajv-formats';
import localize from 'ajv-i18n/localize/zh';
import addKeywords from 'ajv-keywords';
import type { JSONSchema7 } from 'json-schema';
import { match, P } from 'ts-pattern';

export function setupAjv(ajv: Ajv) {
  addKeywords(ajv);
  addFormats(ajv);
  // store meta data
  ajv.addKeyword({
    keyword: '$meta',
    schemaType: 'object',
  });
  return ajv;
}

type ValidateOptions = {
  mutate?: boolean;
  clone?: boolean;
  ajv?: Ajv;
};

type ValidateResult<T> =
  | {
      data: T;
      success: true;
      message: undefined;
    }
  | {
      data: undefined;
      success: false;
      message: string;
      errors: ErrorObject[];
    };

function validate({
  schema,
  data,
  mutate,
  clone,
  ajv,
}: ValidateOptions & {
  schema: any;
  data: any;
}) {
  let opts: Options = {};

  if (mutate) {
    Object.assign(opts, {
      removeAdditional: true,
      useDefaults: true,
      coerceTypes: true,
    });
  }

  if (clone) {
    data = structuredClone(data);
  }

  if (!ajv) {
    ajv = setupAjv(new Ajv(opts));
  }

  const validate = ajv.compile(schema);

  // consider reusing validate instance

  const valid = validate(data);
  const errors = validate.errors;
  localize(errors);

  return {
    data,
    success: valid,
    message: ajv.errorsText(errors),
    errors: errors,
  };
}

type TypeOfSchema<S> = S extends TSchema ? Static<S> : any;

export namespace JsonSchema {
  /**
   * Check data is valid, will not use default
   */
  export function check<S>(schema: S, data: any): ValidateResult<TypeOfSchema<S>> {
    return validate({ schema, data, mutate: false, clone: true }) as any;
  }

  /**
   * Parse data with default value and coerceTypes
   */
  export function safeParse<S>(schema: S, data: any): ValidateResult<TypeOfSchema<S>> {
    return validate({ schema, data, mutate: true, clone: true }) as any;
  }

  export function parse<S>(schema: S, data: any): TypeOfSchema<S> {
    const { data: out, message, errors } = validate({ schema, data, mutate: true, clone: true });
    if (errors) {
      throw new Error(message);
    }
    return out;
  }

  export function create<S>(schema: S, data?: any): TypeOfSchema<S> {
    // will not ensure value match the rule
    return match(schema as JSONSchema7)
      .returnType<any>()
      .with({ const: P.select() }, (v) => v)
      .with({ default: P.select() }, (v) => v)
      .with({ anyOf: P.nonNullable }, (schema) => {
        return create(schema.anyOf[0]);
      })
      .with({ oneOf: P.nonNullable }, (schema) => {
        return create(schema.oneOf[0]);
      })
      .with({ type: 'string' }, (schema) => '')
      .with({ type: P.union('number', 'integer') }, (schema) => 0)
      .with({ type: 'object' }, () => validate({ schema, data: data ?? {}, mutate: true }).data)
      .with({ type: 'null' }, () => null)
      .with({ type: 'boolean' }, (schema) => false)
      .with({ type: 'array' }, (schema) => [])
      .otherwise(() => {
        return undefined;
      });
  }

  export function isPrimitiveType(schema: any): boolean {
    return match(schema as JSONSchema7)
      .returnType<boolean>()
      .with({ type: P.union('number', 'integer', 'string', 'boolean') }, () => true)
      .with({ anyOf: P.nonNullable }, (schema) => {
        return isPrimitiveType(schema.anyOf[0]);
      })
      .with({ oneOf: P.nonNullable }, (schema) => {
        return isPrimitiveType(schema.oneOf[0]);
      })
      .otherwise(() => false);
  }
}
