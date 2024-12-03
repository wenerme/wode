type JsonSchemaTypeName =
  | 'string' //
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

type JsonValue =
  | string //
  | number
  | boolean
  | {
      [key: string]: JsonValue;
    }
  | JsonValue[]
  | null;

type JsonSchemaVersion =
  | 'http://json-schema.org/schema' // latest
  | 'https://json-schema.org/draft/2020-12/schema'
  // draft-07
  | 'http://json-schema.org/draft-07/schema#' //
  | 'http://json-schema.org/draft-07/hyper-schema#';

type JsonSchemaFormatName =
  //
  | 'date-time'
  | 'date'
  | 'time'
  | 'duration'
  //
  | 'email'
  | 'idn-email'
  //
  | 'hostname'
  | 'idn-hostname'
  | 'ipv4'
  | 'ipv6'
  //
  | 'uri'
  | 'uri-reference'
  | 'iri'
  | 'iri-reference'
  | 'uuid'
  | 'uri-template'
  | 'regex'
  | 'json-pointer'
  | 'relative-json-pointer';

export type JsonSchemaDef = {
  $id?: string;
  $ref?: string;
  /**
   * Meta schema
   *
   * Recommended values:
   * - 'http://json-schema.org/schema#'
   * - 'http://json-schema.org/hyper-schema#'
   * - 'http://json-schema.org/draft-07/schema#'
   * - 'http://json-schema.org/draft-07/hyper-schema#'
   *
   * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-5
   */
  $schema?: JsonSchemaVersion | string;
  $comment?: string;

  $defs?: {
    [key: string]: JsonSchemaDef;
  };

  type?: JsonSchemaTypeName | JsonSchemaTypeName[];
  enum?: JsonValue[];
  const?: JsonValue;

  //region Numeric Validation

  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;

  //endregion

  //region String Validation

  maxLength?: number;
  minLength?: number;
  pattern?: string;

  //endregion

  //region Array Validation

  items?: JsonSchemaDef | JsonSchemaDef[];
  additionalItems?: JsonSchemaDef;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  contains?: JsonSchemaDef;
  //endregion

  //region Object Validation

  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  properties?: {
    [key: string]: JsonSchemaDef;
  };
  patternProperties?: {
    [key: string]: JsonSchemaDef;
  };
  additionalProperties?: JsonSchemaDef;
  dependencies?: {
    [key: string]: JsonSchemaDef | string[];
  };
  propertyNames?: JsonSchemaDef;
  //endregion

  //region Conditional

  if?: JsonSchemaDef;
  then?: JsonSchemaDef;
  else?: JsonSchemaDef;

  //endregion

  //region Boolean Logic

  allOf?: JsonSchemaDef[];
  anyOf?: JsonSchemaDef[];
  oneOf?: JsonSchemaDef[];
  not?: JsonSchemaDef;
  //endregion

  //region Semantic

  format?: JsonSchemaFormatName | string;

  //endregion

  //region String-Encoding Non-JSON Data

  contentMediaType?: string;
  contentEncoding?: string;
  contentSchema?: JsonSchemaDef;
  //endregion

  /**
   * use {@link $defs} instead
   */
  definitions?: Record<string, JsonSchemaDef>;

  //region Meta-Data Annotations
  /**
   * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-10
   */

  title?: string;
  description?: string;
  default?: JsonValue;
  readOnly?: boolean;
  writeOnly?: boolean;
  examples?: JsonValue;
  deprecated?: boolean;

  //endregion

  nullable?: boolean;
};
