import type { Static, TSchema } from '@sinclair/typebox';
import Ajv, { type ErrorObject, type Options } from 'ajv';
import addFormats from 'ajv-formats';
import localize from 'ajv-i18n/localize/zh';
import addKeywords from 'ajv-keywords';

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

  const ajv = new Ajv(opts);

  setupAjv(ajv);

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

export interface JsonSchema {
  /**
   * Check data is valid, will not use default
   */
  check<S>(schema: S, data: any): ValidateResult<TypeOfSchema<S>>;

  /**
   * Parse data with default value and coerceTypes
   */
  safeParse<S>(schema: S, data: any): ValidateResult<TypeOfSchema<S>>;

  parse<S>(schema: S, data: any): TypeOfSchema<S>;

  create<S>(schema: S, data?: any): TypeOfSchema<S>;
}

export const JsonSchema: JsonSchema = {
  check: (schema: any, data: any) => {
    return validate({ schema, data, mutate: false, clone: true }) as any;
  },
  safeParse: (schema: any, data: any) => {
    return validate({ schema, data, mutate: true, clone: true }) as any;
  },
  parse: (schema: any, data: any) => {
    const { data: out, message, errors } = validate({ schema, data, mutate: true, clone: true });
    if (errors) {
      throw new Error(message);
    }
    return out;
  },
  create: (schema: any, data: any = {}) => {
    return validate({ schema, data, mutate: true }).data;
  },
};
