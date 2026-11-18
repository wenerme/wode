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

export interface FormatJsonSchemaTypeScriptOptions extends FormatJsonSchemaOptions {
	name?: string;
	export?: boolean;
}

interface JsonSchema {
	$defs?: Record<string, JsonSchema>;
	definitions?: Record<string, JsonSchema>;
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

/** Render an object JSON Schema as a copyable TypeScript interface or type alias. */
export function formatJsonSchemaTypeScript(
	schema: JsonSchema | undefined | null,
	options: FormatJsonSchemaTypeScriptOptions = {},
): string {
	const name = options.name ?? 'Options';
	if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(name)) throw new Error('Invalid TypeScript type name');
	const body = formatJsonSchemaTypeScriptExpression(schema);
	const prefix = options.export === false ? '' : 'export ';
	if (body.startsWith('{')) return `${prefix}interface ${name} ${body}`;
	return `${prefix}type ${name} = ${body};`;
}

/** TypeScript syntax, unlike the compact human-readable schema notation. */
export function formatJsonSchemaTypeScriptExpression(schema: JsonSchema | null | undefined): string {
	const root = schema;
	function type(input: JsonSchema | boolean | undefined, depth = 0, refs = new Set<string>()): string {
		if (input === false) return 'never';
		if (!input || input === true || depth > 32) return 'unknown';
		if (input.$ref) {
			if (refs.has(input.$ref) || !input.$ref.startsWith('#/')) return 'unknown';
			let target: unknown = root;
			for (const part of input.$ref.slice(2).split('/')) {
				const key = part.replace(/~1/gu, '/').replace(/~0/gu, '~');
				if (!target || typeof target !== 'object' || !Object.hasOwn(target, key)) return 'unknown';
				target = (target as Record<string, unknown>)[key];
			}
			return type(target as JsonSchema, depth + 1, new Set([...refs, input.$ref]));
		}
		if (Object.hasOwn(input, 'const')) return JSON.stringify(input.const) ?? 'unknown';
		if (input.enum) return input.enum.map((value) => JSON.stringify(value)).join(' | ') || 'never';
		for (const [key, separator] of [['anyOf', ' | '], ['oneOf', ' | '], ['allOf', ' & ']] as const) {
			if (input[key]) return `(${input[key]!.map((item) => type(item, depth + 1, refs)).join(separator)})`;
		}
		if (Array.isArray(input.type)) return input.type.map((value) => type({ ...input, type: value }, depth + 1, refs)).join(' | ');
		if (input.type === 'array') {
			if (Array.isArray(input.items)) return `[${input.items.map((item) => type(item, depth + 1, refs)).join(', ')}]`;
			return `Array<${type(input.items, depth + 1, refs)}>`;
		}
		if (input.type === 'object' || input.properties) {
			const required = new Set(input.required ?? []);
			const lines = Object.entries(input.properties ?? {}).map(([key, property]) => {
				const name = /^[A-Za-z_$][\w$]*$/u.test(key) ? key : JSON.stringify(key);
				const comment = property.description ? `/** ${property.description.replace(/\*\//gu, '* /').replace(/[\r\n]/gu, ' ')} */\n` : '';
				return `${comment}${name}${required.has(key) ? '' : '?'}: ${type(property, depth + 1, refs)};`;
			});
			if (input.additionalProperties !== false) {
				// Unknown permits optional named properties to coexist with an open index signature.
				lines.push(`[key: string]: ${lines.length ? 'unknown' : type(input.additionalProperties, depth + 1, refs)};`);
			}
			return `{\n${lines.map((line) => line.split('\n').map((part) => `  ${part}`).join('\n')).join('\n')}\n}`;
		}
		if (input.type === 'integer' || input.type === 'number') return 'number';
		if (input.type === 'string' || input.type === 'boolean' || input.type === 'null') return input.type;
		return 'unknown';
	}
	return type(schema ?? undefined);
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
