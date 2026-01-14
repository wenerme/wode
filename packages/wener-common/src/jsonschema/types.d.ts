type JsonSchemaTypeName =
	| 'string' //
	| 'number'
	| 'integer'
	| 'boolean'
	| 'object'
	| 'array'
	| 'null'
	| undefined;

type JsonValue =
	| string //
	| number
	| boolean
	| { [key: string]: JsonValue }
	| JsonValue[]
	| null
	| undefined; //

type JsonSchemaVersion =
	| 'http://json-schema.org/schema' // latest
	//
	| 'https://json-schema.org/draft/2020-12/schema'
	| 'https://json-schema.org/draft/2019-09/schema'
	// draft-07
	| 'https://json-schema.org/draft-07/schema'
	| 'http://json-schema.org/draft-07/schema'
	| 'https://json-schema.org/draft-07/hyper-schema'
	| 'http://json-schema.org/draft-07/hyper-schema'
	//
	| 'https://json-schema.org/draft-04/schema';
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

/**
 * JSON Schema Definition
 *
 * @see https://json-schema.org/specification-links.html
 */
export type JsonSchemaDef<I = any, _O = I> = {
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

	$defs?: { [key: string]: JsonSchemaDef };

	type?: JsonSchemaTypeName | JsonSchemaTypeName[];
	enum?: JsonValue;
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

	/**
	 * schema for array items
	 * @see https://json-schema.org/understanding-json-schema/reference/array.html#items
	 */
	items?: JsonSchemaDef | JsonSchemaDef[];
	additionalItems?: JsonSchemaDef | boolean;
	maxItems?: number;
	minItems?: number;
	uniqueItems?: boolean;
	contains?: JsonSchemaDef;

	//region Draft 2022-12
	minContains?: number;
	maxContains?: number;
	prefixItems?: JsonSchemaDef[];
	//endregion

	//endregion

	//region Object Validation

	maxProperties?: number;
	minProperties?: number;
	required?: string[];
	properties?: { [key: string]: JsonSchemaDef };
	patternProperties?: { [key: string]: JsonSchemaDef };
	/**
	 * Replaced by {@link unevaluatedProperties} in Draft 2019-09+
	 */
	additionalProperties?: JsonSchemaDef | boolean; // true = {}
	/**
	 * Superseded by {@link dependentSchemas}, {@link dependentRequired} in Draft 2019-09+
	 */
	dependencies?: { [key: string]: undefined | JsonSchemaDef | string[] };
	propertyNames?: JsonSchemaDef;

	//region Draft 2019-09+

	dependentSchemas?: { [key: string]: JsonSchemaDef };
	dependentRequired?: { [key: string]: string[] };
	unevaluatedProperties?: JsonSchemaDef | boolean;
	unevaluatedItems?: JsonSchemaDef | boolean;

	//endregion

	//endregion

	//region Conditional

	if?: JsonSchemaDef;
	then?: JsonSchemaDef;
	else?: JsonSchemaDef;

	//endregion

	//region Boolean Logic

	allOf?: JsonSchemaDef[]; // extends, merge
	anyOf?: JsonSchemaDef[];
	oneOf?: JsonSchemaDef[]; // polymorphism, enum
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

	//region OpenAPI Spec

	nullable?: boolean;

	discriminator?: {
		propertyName: string;
		mapping?: { [key: string]: string };
	};

	//endregion

	// [key: `x-${string}`]: JsonValue;
	[key: string]: JsonValue;
};
