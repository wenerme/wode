import type { QueryJsonSchema, QuerySchemaDiagnostic, QuerySchemaDiagnosticCode } from './query-json-schema-types';
import type { QueryFieldKind, QueryJsonPrimitive } from './query-model';
import { isQueryJsonValue } from './query-model';

const allowedSchemaTypes = new Set(['null', 'object', 'array', 'string', 'number', 'integer', 'boolean']);

export function validateSchemaShape(
	schema: QueryJsonSchema,
	segments: readonly string[],
	diagnostics: QuerySchemaDiagnostic[],
) {
	const source = schema as Record<string, unknown>;
	let valid = true;
	const reject = (message: string) => {
		valid = false;
		diagnostics.push(diagnostic('invalid-schema', 'error', toPointer(segments), message));
	};
	if (source.type !== undefined && !isSchemaType(source.type))
		reject('Schema type must be a supported string or dense string array.');
	for (const keyword of ['properties', '$defs', 'definitions'] as const) {
		if (source[keyword] !== undefined && !isRecord(source[keyword])) reject(`Schema ${keyword} must be an object map.`);
	}
	if (source.required !== undefined && !stringArray(source.required))
		reject('Schema required must be a dense array of strings.');
	if (source.items !== undefined && !isRecord(source.items)) reject('Schema items must be an object schema.');
	if (source.enum !== undefined && !isPrimitiveArray(source.enum))
		reject('Schema enum must be a non-empty dense array of JSON primitives.');
	if (source.oneOf !== undefined && !isSchemaArray(source.oneOf))
		reject('Schema oneOf must be a non-empty dense array of object schemas.');
	if (source['x-enumNames'] !== undefined && !stringArray(source['x-enumNames']))
		reject('Schema x-enumNames must be a dense array of strings.');
	for (const keyword of ['title', 'description', 'format'] as const) {
		if (source[keyword] !== undefined && typeof source[keyword] !== 'string')
			reject(`Schema ${keyword} must be a string.`);
	}
	for (const keyword of ['readOnly', 'writeOnly'] as const) {
		if (source[keyword] !== undefined && typeof source[keyword] !== 'boolean')
			reject(`Schema ${keyword} must be a boolean.`);
	}
	if (source.default !== undefined && !isQueryJsonValue(source.default))
		reject('Schema default must be a dense JSON value.');
	if (source.const !== undefined && !isQueryJsonPrimitive(source.const))
		reject('Schema const must be a finite JSON primitive.');
	else if (
		isQueryJsonPrimitive(source.const) &&
		normalizedTypes(schema.type).length &&
		!normalizedTypes(schema.type).some((type) => primitiveMatchesType(source.const as QueryJsonPrimitive, type))
	)
		reject('Schema const must match its declared type.');
	if (
		isQueryJsonPrimitive(source.const) &&
		isPrimitiveArray(source.enum) &&
		!source.enum.some((value) => Object.is(value, source.const))
	)
		reject('Schema const must be allowed by its enum.');
	return valid;
}

export function toPointer(segments: readonly string[]) {
	return segments.length ? `/${segments.map(encodePointerSegment).join('/')}` : '';
}

export function decodePointer(pointer: string) {
	return pointer ? pointer.slice(1).split('/').map(decodePointerSegment) : [];
}

export function encodePointerSegment(value: string) {
	return value.replaceAll('~', '~0').replaceAll('/', '~1');
}

export function decodePointerSegment(value: string) {
	return value.replaceAll('~1', '/').replaceAll('~0', '~');
}

export function humanize(value: string) {
	const label = value
		.replace(/([a-z\d])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.trim();
	return label ? label[0].toUpperCase() + label.slice(1) : value;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function schemaObjectChildren(value: Record<string, unknown>) {
	const children: unknown[] = [];
	for (const keyword of ['properties', '$defs', 'definitions'] as const) {
		if (isRecord(value[keyword])) children.push(...Object.values(value[keyword]));
	}
	if (value.items !== undefined) children.push(value.items);
	if (Array.isArray(value.oneOf)) children.push(...value.oneOf);
	return children;
}

export function hasSchemaObjectCycle(value: unknown): boolean {
	if (!isRecord(value)) return false;
	const ancestors = new WeakSet<object>();
	const visited = new WeakSet<object>();
	const stack: { node: Record<string, unknown>; children: unknown[]; index: number }[] = [
		{ node: value, children: schemaObjectChildren(value), index: 0 },
	];
	ancestors.add(value);
	while (stack.length) {
		const frame = stack[stack.length - 1];
		if (frame.index >= frame.children.length) {
			ancestors.delete(frame.node);
			visited.add(frame.node);
			stack.pop();
			continue;
		}
		const child = frame.children[frame.index];
		frame.index += 1;
		if (!isRecord(child)) continue;
		if (ancestors.has(child)) return true;
		if (visited.has(child)) continue;
		ancestors.add(child);
		stack.push({ node: child, children: schemaObjectChildren(child), index: 0 });
	}
	return false;
}

function isSchemaType(value: unknown) {
	if (typeof value === 'string') return allowedSchemaTypes.has(value);
	if (!Array.isArray(value) || value.length === 0) return false;
	for (let index = 0; index < value.length; index += 1) {
		if (!(index in value) || typeof value[index] !== 'string' || !allowedSchemaTypes.has(value[index])) return false;
	}
	return true;
}

export function normalizedTypes(type: QueryJsonSchema['type']) {
	if (typeof type === 'string') return [type];
	if (!Array.isArray(type)) return [];
	const output: string[] = [];
	for (let index = 0; index < type.length; index += 1) {
		if (!(index in type) || typeof type[index] !== 'string') return [];
		output.push(type[index]);
	}
	return output;
}

export function intersectSchemaTypes(left: readonly string[], right: readonly string[]) {
	const output: string[] = [];
	for (const leftType of left) {
		for (const rightType of right) {
			const type =
				leftType === rightType
					? leftType
					: (leftType === 'number' && rightType === 'integer') || (leftType === 'integer' && rightType === 'number')
						? 'integer'
						: undefined;
			if (type && !output.includes(type)) output.push(type);
		}
	}
	return output;
}

export function isQueryJsonPrimitive(value: unknown): value is QueryJsonPrimitive {
	return (
		value === null ||
		typeof value === 'string' ||
		typeof value === 'boolean' ||
		(typeof value === 'number' && Number.isFinite(value))
	);
}

export function primitiveMatchesType(value: QueryJsonPrimitive, type: string) {
	switch (type) {
		case 'null':
			return value === null;
		case 'string':
			return typeof value === 'string';
		case 'boolean':
			return typeof value === 'boolean';
		case 'number':
			return typeof value === 'number' && Number.isFinite(value);
		case 'integer':
			return typeof value === 'number' && Number.isInteger(value);
		default:
			return false;
	}
}

export function isPrimitiveArray(value: unknown): value is readonly QueryJsonPrimitive[] {
	if (!Array.isArray(value) || value.length === 0) return false;
	for (let index = 0; index < value.length; index += 1) {
		if (!(index in value) || !isQueryJsonPrimitive(value[index])) return false;
	}
	return true;
}

export function isSchemaArray(value: unknown): value is readonly QueryJsonSchema[] {
	if (!Array.isArray(value) || value.length === 0) return false;
	for (let index = 0; index < value.length; index += 1) {
		if (!(index in value) || !isRecord(value[index])) return false;
	}
	return true;
}

export function stringValue(value: unknown) {
	return typeof value === 'string' && value.trim() ? value : undefined;
}

export function numberValue(value: unknown) {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function stringArray(value: unknown) {
	if (!Array.isArray(value)) return undefined;
	for (let index = 0; index < value.length; index += 1) {
		if (!(index in value) || typeof value[index] !== 'string') return undefined;
	}
	return value as string[];
}

export function isFieldKind(value: unknown): value is QueryFieldKind {
	return (
		typeof value === 'string' &&
		['string', 'number', 'integer', 'boolean', 'date', 'datetime', 'enum', 'array', 'unknown'].includes(value)
	);
}

export function diagnostic(
	code: QuerySchemaDiagnosticCode,
	severity: QuerySchemaDiagnostic['severity'],
	path: string,
	message: string,
	ref?: string,
): QuerySchemaDiagnostic {
	return { code, severity, path, message, ref };
}
