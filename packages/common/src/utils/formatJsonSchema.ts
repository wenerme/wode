/**
 * Format JSON Schema as human-readable TypeScript-like syntax
 * Example: {name:string, age?:number, tags:string[]}
 */

export interface FormatJsonSchemaOptions {
	/** Maximum depth to expand nested objects (default: 3) */
	maxDepth?: number;
	/** Include property descriptions as inline comments (default: false) */
	includeDescriptions?: boolean;
	/** Compact mode - single line output (default: true) */
	compact?: boolean;
}

interface JsonSchema {
	type?: string | string[];
	properties?: Record<string, JsonSchema>;
	required?: string[];
	items?: JsonSchema | JsonSchema[];
	enum?: unknown[];
	const?: unknown;
	oneOf?: JsonSchema[];
	anyOf?: JsonSchema[];
	allOf?: JsonSchema[];
	$ref?: string;
	description?: string;
	title?: string;
	default?: unknown;
	format?: string;
	minimum?: number;
	maximum?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	additionalProperties?: boolean | JsonSchema;
}

/**
 * Format a JSON Schema into a compact TypeScript-like representation
 */
export function formatJsonSchema(schema: JsonSchema | undefined | null, options: FormatJsonSchemaOptions = {}): string {
	const { maxDepth = 3, compact = true } = options;

	if (!schema) {
		return '{}';
	}

	// Empty object schema
	if (Object.keys(schema).length === 0) {
		return '{}';
	}

	return formatType(schema, 0, maxDepth, compact);
}

function formatType(schema: JsonSchema, depth: number, maxDepth: number, compact: boolean): string {
	if (depth > maxDepth) {
		return '...';
	}

	// Handle const
	if (schema.const !== undefined) {
		return JSON.stringify(schema.const);
	}

	// Handle enum
	if (schema.enum) {
		return schema.enum.map((v) => JSON.stringify(v)).join('|');
	}

	// Handle oneOf/anyOf
	if (schema.oneOf) {
		const types = schema.oneOf.map((s) => formatType(s, depth, maxDepth, compact));
		return types.join('|');
	}
	if (schema.anyOf) {
		const types = schema.anyOf.map((s) => formatType(s, depth, maxDepth, compact));
		return types.join('|');
	}

	// Handle allOf (intersection)
	if (schema.allOf) {
		const types = schema.allOf.map((s) => formatType(s, depth, maxDepth, compact));
		return types.join('&');
	}

	// Handle $ref (simplified)
	if (schema.$ref) {
		const refName = schema.$ref.split('/').pop() || 'ref';
		return refName;
	}

	// Get the type(s)
	const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];

	// Handle multiple types
	if (types.length > 1) {
		return types.map((t) => formatSingleType(t, schema, depth, maxDepth, compact)).join('|');
	}

	const type = types[0];
	return formatSingleType(type, schema, depth, maxDepth, compact);
}

function formatSingleType(
	type: string | undefined,
	schema: JsonSchema,
	depth: number,
	maxDepth: number,
	compact: boolean,
): string {
	switch (type) {
		case 'string':
			if (schema.format) {
				return `string<${schema.format}>`;
			}
			return 'string';

		case 'number':
		case 'integer':
			return 'number';

		case 'boolean':
			return 'boolean';

		case 'null':
			return 'null';

		case 'array':
			if (schema.items) {
				if (Array.isArray(schema.items)) {
					// Tuple
					const itemTypes = schema.items.map((item) => formatType(item, depth + 1, maxDepth, compact));
					return `[${itemTypes.join(', ')}]`;
				}
				const itemType = formatType(schema.items, depth + 1, maxDepth, compact);
				return `${itemType}[]`;
			}
			return 'unknown[]';

		case 'object':
			return formatObject(schema, depth, maxDepth, compact);

		default:
			// No type specified, try to infer from properties
			if (schema.properties) {
				return formatObject(schema, depth, maxDepth, compact);
			}
			return 'unknown';
	}
}

function formatObject(schema: JsonSchema, depth: number, maxDepth: number, compact: boolean): string {
	if (!schema.properties || Object.keys(schema.properties).length === 0) {
		if (schema.additionalProperties === true) {
			return 'Record<string, unknown>';
		}
		if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
			const valueType = formatType(schema.additionalProperties, depth + 1, maxDepth, compact);
			return `Record<string, ${valueType}>`;
		}
		return '{}';
	}

	const required = new Set(schema.required || []);
	const props: string[] = [];

	for (const [key, propSchema] of Object.entries(schema.properties)) {
		const isRequired = required.has(key);
		const propType = formatType(propSchema, depth + 1, maxDepth, compact);
		const optionalMark = isRequired ? '' : '?';
		props.push(`${key}${optionalMark}:${propType}`);
	}

	if (compact) {
		return `{${props.join(', ')}}`;
	}

	const indent = '  '.repeat(depth + 1);
	const closingIndent = '  '.repeat(depth);
	return `{\n${props.map((p) => `${indent}${p}`).join(',\n')}\n${closingIndent}}`;
}

/**
 * Format a tool signature with name and parameters
 * Example: get_user {id:string, include_details?:boolean}
 */
export function formatToolSignature(
	name: string,
	inputSchema: JsonSchema | undefined | null,
	options: FormatJsonSchemaOptions = {},
): string {
	// Don't show params if schema is empty or has no properties
	if (!inputSchema || Object.keys(inputSchema).length === 0) {
		return name;
	}
	const schemaObj = inputSchema as { properties?: Record<string, unknown> };
	if (!schemaObj.properties || Object.keys(schemaObj.properties).length === 0) {
		return name;
	}
	const params = formatJsonSchema(inputSchema, options);
	if (params === '{}') {
		return name;
	}
	return `${name} ${params}`;
}
