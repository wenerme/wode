import type { QueryField, QueryFieldKind, QueryJsonPrimitive, QueryJsonValue } from './query-model';

export type QueryJsonSchemaExtension = {
	label?: string;
	editor?: string;
	operators?: readonly string[];
	hidden?: boolean;
	group?: string;
	order?: number;
	placeholder?: string;
	field?: string;
	leaf?: boolean;
	kind?: QueryFieldKind;
	[key: string]: unknown;
};

export type QueryJsonSchema = {
	$ref?: string;
	type?: string | readonly string[];
	title?: string;
	description?: string;
	format?: string;
	default?: QueryJsonValue;
	const?: QueryJsonPrimitive;
	enum?: readonly QueryJsonPrimitive[];
	oneOf?: readonly QueryJsonSchema[];
	properties?: Record<string, QueryJsonSchema>;
	required?: readonly string[];
	items?: QueryJsonSchema;
	readOnly?: boolean;
	writeOnly?: boolean;
	$defs?: Record<string, QueryJsonSchema>;
	definitions?: Record<string, QueryJsonSchema>;
	'x-enumNames'?: readonly string[];
	'x-query'?: QueryJsonSchemaExtension;
};

export type QuerySchemaDiagnosticCode =
	| 'remote-ref'
	| 'unresolved-ref'
	| 'cyclic-ref'
	| 'max-depth'
	| 'duplicate-field'
	| 'invalid-extension'
	| 'unknown-extension'
	| 'invalid-schema';

export type QuerySchemaDiagnostic = {
	code: QuerySchemaDiagnosticCode;
	severity: 'warning' | 'error';
	path: string;
	message: string;
	ref?: string;
};

export type QuerySchemaFieldContext = {
	path: string;
	segments: readonly string[];
	schema: QueryJsonSchema;
	field: QueryField;
};

export type QueryFieldsFromJsonSchemaOptions = {
	maxDepth?: number;
	fieldOverrides?: Readonly<Record<string, Partial<QueryField>>>;
	include?: (context: QuerySchemaFieldContext) => boolean;
	mapField?: (context: QuerySchemaFieldContext) => QueryField | null;
};

export type QueryFieldsFromJsonSchemaResult = {
	fields: QueryField[];
	diagnostics: QuerySchemaDiagnostic[];
};
