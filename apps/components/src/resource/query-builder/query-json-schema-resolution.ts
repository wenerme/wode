import type { QueryJsonSchema, QuerySchemaDiagnostic } from './query-json-schema-types';
import {
	decodePointerSegment,
	diagnostic,
	hasSchemaObjectCycle,
	intersectSchemaTypes,
	isPrimitiveArray,
	isQueryJsonPrimitive,
	isRecord,
	isSchemaArray,
	normalizedTypes,
	primitiveMatchesType,
	stringArray,
	stringValue,
	toPointer,
	validateSchemaShape,
} from './query-json-schema-utils';
import type { QueryOption } from './query-model';

export type ResolvedQuerySchema = { schema: QueryJsonSchema; stack: readonly string[] };

export function resolveSchema(
	input: unknown,
	root: QueryJsonSchema,
	stack: readonly string[],
	segments: readonly string[],
	diagnostics: QuerySchemaDiagnostic[],
): ResolvedQuerySchema | undefined {
	if (!isRecord(input)) {
		diagnostics.push(diagnostic('invalid-schema', 'error', toPointer(segments), 'Schema nodes must be JSON objects.'));
		return undefined;
	}
	if (stack.length > 64) {
		diagnostics.push(
			diagnostic('max-depth', 'error', toPointer(segments), 'Schema reference chain exceeds 64 levels.'),
		);
		return undefined;
	}
	const schema = input as QueryJsonSchema;
	if (segments.length && hasSchemaObjectCycle(schema)) {
		diagnostics.push(
			diagnostic('invalid-schema', 'error', toPointer(segments), 'Schema object cycles are not supported.'),
		);
		return undefined;
	}
	if (!validateSchemaShape(schema, segments, diagnostics)) return undefined;
	if (schema.$ref === undefined) return { schema, stack };
	if (typeof schema.$ref !== 'string' || !schema.$ref) {
		diagnostics.push(
			diagnostic('invalid-schema', 'error', toPointer(segments), 'Schema $ref must be a non-empty string.'),
		);
		return undefined;
	}
	const ref = schema.$ref;
	if (!ref.startsWith('#')) {
		diagnostics.push(
			diagnostic('remote-ref', 'error', toPointer(segments), 'Only local JSON Pointer references are supported.', ref),
		);
		return undefined;
	}
	const parsed = parseLocalRef(ref);
	if (!parsed) {
		diagnostics.push(
			diagnostic(
				'unresolved-ref',
				'error',
				toPointer(segments),
				'Local reference is not a valid URI-encoded JSON Pointer.',
				ref,
			),
		);
		return undefined;
	}
	if (stack.includes(parsed.canonical)) {
		diagnostics.push(diagnostic('cyclic-ref', 'error', toPointer(segments), 'Cyclic schema reference rejected.', ref));
		return undefined;
	}
	const target = resolvePointer(root, parsed.segments);
	if (target === undefined) {
		diagnostics.push(
			diagnostic('unresolved-ref', 'error', toPointer(segments), 'Schema reference could not be resolved.', ref),
		);
		return undefined;
	}
	if (!isRecord(target) || !validateSchemaShape(target as QueryJsonSchema, segments, diagnostics)) return undefined;
	const { $ref: _ignored, ...siblings } = schema;
	const nextStack = [...stack, parsed.canonical];
	const merged = mergeReferencedSchema(target as QueryJsonSchema, siblings, root, nextStack, segments, diagnostics);
	if (!merged) return undefined;
	return resolveSchema(merged, root, nextStack, segments, diagnostics);
}

function parseLocalRef(ref: string) {
	try {
		const fragment = decodeURIComponent(ref.slice(1));
		if (fragment !== '' && !fragment.startsWith('/')) return undefined;
		const encodedSegments = fragment ? fragment.slice(1).split('/') : [];
		if (encodedSegments.some((segment) => /~(?:[^01]|$)/.test(segment))) return undefined;
		const segments = encodedSegments.map(decodePointerSegment);
		return { segments, canonical: `#${toPointer(segments)}` };
	} catch {
		return undefined;
	}
}

function resolvePointer(root: QueryJsonSchema, segments: readonly string[]): unknown {
	let value: unknown = root;
	for (const segment of segments) {
		if (Array.isArray(value)) {
			if (!/^(?:0|[1-9]\d*)$/.test(segment)) return undefined;
			const index = Number(segment);
			if (!Number.isSafeInteger(index) || !Object.hasOwn(value, index)) return undefined;
			value = value[index];
			continue;
		}
		if (!isRecord(value) || !Object.hasOwn(value, segment)) return undefined;
		value = value[segment];
	}
	return value;
}

function mergeReferencedSchema(
	target: QueryJsonSchema,
	siblings: QueryJsonSchema,
	root: QueryJsonSchema,
	stack: readonly string[],
	segments: readonly string[],
	diagnostics: QuerySchemaDiagnostic[],
) {
	if (hasSchemaObjectCycle(target) || hasSchemaObjectCycle(siblings)) {
		diagnostics.push(
			diagnostic('invalid-schema', 'error', toPointer(segments), 'Schema object cycles are not supported.'),
		);
		return undefined;
	}
	const normalizedTarget = normalizeFiniteOneOf(target, root, stack, segments, diagnostics);
	const normalizedSibling = normalizeFiniteOneOf(siblings, root, stack, segments, diagnostics);
	if (!normalizedTarget || !normalizedSibling) return undefined;
	return mergeSchemaFragments(normalizedTarget, normalizedSibling, segments, diagnostics);
}

function normalizeFiniteOneOf(
	schema: QueryJsonSchema,
	root: QueryJsonSchema,
	stack: readonly string[],
	segments: readonly string[],
	diagnostics: QuerySchemaDiagnostic[],
	depth = 0,
): QueryJsonSchema | undefined {
	if (depth > 64) {
		diagnostics.push(diagnostic('max-depth', 'error', toPointer(segments), 'Schema normalization exceeds 64 levels.'));
		return undefined;
	}
	if (!isRecord(schema)) {
		diagnostics.push(diagnostic('invalid-schema', 'error', toPointer(segments), 'Schema nodes must be JSON objects.'));
		return undefined;
	}
	let normalized = schema;
	let activeStack = stack;
	if (normalized.$ref) {
		const resolved = resolveSchema(normalized, root, activeStack, segments, diagnostics);
		if (!resolved) return undefined;
		normalized = resolved.schema;
		activeStack = resolved.stack;
	}
	for (const keyword of ['properties', '$defs', 'definitions'] as const) {
		const source = normalized[keyword];
		if (!source) continue;
		const output = Object.create(null) as Record<string, QueryJsonSchema>;
		for (const [key, child] of Object.entries(source)) {
			const next = normalizeFiniteOneOf(child, root, activeStack, [...segments, keyword, key], diagnostics, depth + 1);
			if (!next) return undefined;
			Object.defineProperty(output, key, { value: next, enumerable: true, configurable: true, writable: true });
		}
		normalized = { ...normalized, [keyword]: output };
	}
	if (normalized.items) {
		const items = normalizeFiniteOneOf(
			normalized.items,
			root,
			activeStack,
			[...segments, 'items'],
			diagnostics,
			depth + 1,
		);
		if (!items) return undefined;
		normalized = { ...normalized, items };
	}
	if (normalized.oneOf === undefined) return normalized;
	if (!isSchemaArray(normalized.oneOf)) return undefined;
	const options: QueryOption[] = [];
	for (let index = 0; index < normalized.oneOf.length; index += 1) {
		const resolved = resolveSchema(
			normalized.oneOf[index],
			root,
			activeStack,
			[...segments, 'oneOf', String(index)],
			diagnostics,
		);
		if (!resolved) return undefined;
		const value = resolved.schema.const;
		if (!isQueryJsonPrimitive(value)) {
			diagnostics.push(
				diagnostic(
					'invalid-schema',
					'error',
					toPointer([...segments, 'oneOf', String(index)]),
					'Only finite const-based oneOf references can be combined.',
				),
			);
			return undefined;
		}
		if (options.some((option) => Object.is(option.value, value))) {
			diagnostics.push(
				diagnostic(
					'invalid-schema',
					'error',
					toPointer([...segments, 'oneOf', String(index)]),
					'oneOf constant options must be unique.',
				),
			);
			return undefined;
		}
		options.push({ value, label: stringValue(resolved.schema.title) ?? String(value) });
	}
	const types = normalizedTypes(normalized.type);
	const enumValues = isPrimitiveArray(normalized.enum) ? normalized.enum : undefined;
	const hasConst = normalized.const !== undefined;
	const values = options.filter(
		(option) =>
			(!types.length || types.some((type) => primitiveMatchesType(option.value, type))) &&
			(!enumValues || enumValues.some((value) => Object.is(value, option.value))) &&
			(!hasConst || Object.is(normalized.const, option.value)),
	);
	if (!values.length) {
		diagnostics.push(
			diagnostic('invalid-schema', 'error', toPointer(segments), 'Schema value constraints have no intersection.'),
		);
		return undefined;
	}
	const enumNames = stringArray(normalized['x-enumNames']);
	const labels = values.map((option) => {
		const enumIndex = enumValues?.findIndex((value) => Object.is(value, option.value)) ?? -1;
		return enumIndex >= 0 ? (enumNames?.[enumIndex] ?? option.label) : option.label;
	});
	const { oneOf: _oneOf, ...rest } = normalized;
	return { ...rest, enum: values.map((option) => option.value), 'x-enumNames': labels };
}

function mergeSchemaFragments(
	target: QueryJsonSchema,
	sibling: QueryJsonSchema,
	segments: readonly string[],
	diagnostics: QuerySchemaDiagnostic[],
): QueryJsonSchema | undefined {
	if (hasSchemaObjectCycle(target) || hasSchemaObjectCycle(sibling)) {
		diagnostics.push(
			diagnostic('invalid-schema', 'error', toPointer(segments), 'Schema object cycles are not supported.'),
		);
		return undefined;
	}
	if (!validateSchemaShape(target, segments, diagnostics) || !validateSchemaShape(sibling, segments, diagnostics))
		return undefined;
	const targetTypes = normalizedTypes(target.type);
	const siblingTypes = normalizedTypes(sibling.type);
	const mergedTypes =
		targetTypes.length && siblingTypes.length ? intersectSchemaTypes(targetTypes, siblingTypes) : undefined;
	if (mergedTypes?.length === 0) {
		diagnostics.push(
			diagnostic(
				'invalid-schema',
				'error',
				toPointer(segments),
				'Reference siblings declare incompatible schema types.',
			),
		);
		return undefined;
	}
	const effectiveTypes = mergedTypes ?? (siblingTypes.length ? siblingTypes : targetTypes);
	const targetHasValueConstraint =
		target.enum !== undefined || target.const !== undefined || target.oneOf !== undefined;
	const siblingHasValueConstraint =
		sibling.enum !== undefined || sibling.const !== undefined || sibling.oneOf !== undefined;
	if (
		(target.oneOf && (sibling.type !== undefined || siblingHasValueConstraint)) ||
		(sibling.oneOf && (target.type !== undefined || targetHasValueConstraint))
	) {
		diagnostics.push(
			diagnostic(
				'invalid-schema',
				'error',
				toPointer(segments),
				'Combining oneOf with sibling value or type constraints is not supported.',
			),
		);
		return undefined;
	}
	const targetEnum = isPrimitiveArray(target.enum) ? target.enum : undefined;
	const siblingEnum = isPrimitiveArray(sibling.enum) ? sibling.enum : undefined;
	const intersectedEnum =
		targetEnum && siblingEnum
			? targetEnum.filter((value) => siblingEnum.some((candidate) => Object.is(candidate, value)))
			: (siblingEnum ?? targetEnum);
	const mergedEnum = effectiveTypes.length
		? intersectedEnum?.filter((value) => effectiveTypes.some((type) => primitiveMatchesType(value, type)))
		: intersectedEnum;
	if (intersectedEnum && mergedEnum?.length === 0) {
		diagnostics.push(
			diagnostic(
				'invalid-schema',
				'error',
				toPointer(segments),
				'Reference enum has no values allowed by the combined constraints.',
			),
		);
		return undefined;
	}
	const hasTargetConst = target.const !== undefined;
	const hasSiblingConst = sibling.const !== undefined;
	if (hasTargetConst && hasSiblingConst && !Object.is(target.const, sibling.const)) {
		diagnostics.push(
			diagnostic(
				'invalid-schema',
				'error',
				toPointer(segments),
				'Reference siblings declare incompatible const values.',
			),
		);
		return undefined;
	}
	const mergedConst = hasSiblingConst ? sibling.const : target.const;
	const hasMergedConst = hasTargetConst || hasSiblingConst;
	if (
		hasMergedConst &&
		effectiveTypes.length &&
		!effectiveTypes.some((type) => primitiveMatchesType(mergedConst!, type))
	) {
		diagnostics.push(
			diagnostic('invalid-schema', 'error', toPointer(segments), 'Reference const does not match the combined type.'),
		);
		return undefined;
	}
	if (hasMergedConst && mergedEnum && !mergedEnum.some((value) => Object.is(value, mergedConst))) {
		diagnostics.push(
			diagnostic(
				'invalid-schema',
				'error',
				toPointer(segments),
				'Reference const is not allowed by the combined enum.',
			),
		);
		return undefined;
	}
	const mergedEnumNames = mergedEnum?.map(
		(value) => enumValueLabel(sibling, value) ?? enumValueLabel(target, value) ?? String(value),
	);
	let valid = true;
	const mergeMap = (
		left: Record<string, QueryJsonSchema> | undefined,
		right: Record<string, QueryJsonSchema> | undefined,
		keyword: 'properties' | '$defs' | 'definitions',
	) => {
		if (!left && !right) return undefined;
		const output = { ...left, ...right };
		for (const key of Object.keys(left ?? {})) {
			if (!left || !right || !Object.hasOwn(left, key) || !Object.hasOwn(right, key)) continue;
			const merged = mergeSchemaFragments(left[key], right[key], [...segments, keyword, key], diagnostics);
			if (merged)
				Object.defineProperty(output, key, { value: merged, enumerable: true, configurable: true, writable: true });
			else delete output[key];
		}
		return output;
	};
	let items = sibling.items ?? target.items;
	if (target.items && sibling.items) {
		const mergedItems = mergeSchemaFragments(target.items, sibling.items, [...segments, 'items'], diagnostics);
		if (mergedItems) items = mergedItems;
		else valid = false;
	}
	const properties = mergeMap(target.properties, sibling.properties, 'properties');
	const required =
		target.required || sibling.required
			? [...new Set([...(target.required ?? []), ...(sibling.required ?? [])])].filter(
					(name) => !properties || Object.hasOwn(properties, name),
				)
			: undefined;
	return valid
		? {
				...target,
				...sibling,
				type: mergedTypes ? (mergedTypes.length === 1 ? mergedTypes[0] : mergedTypes) : (sibling.type ?? target.type),
				enum: mergedEnum,
				const: mergedConst,
				'x-enumNames': mergedEnumNames,
				properties,
				$defs: mergeMap(target.$defs, sibling.$defs, '$defs'),
				definitions: mergeMap(target.definitions, sibling.definitions, 'definitions'),
				items,
				required,
			}
		: undefined;
}

function enumValueLabel(schema: QueryJsonSchema, value: QueryOption['value']) {
	if (!isPrimitiveArray(schema.enum)) return undefined;
	const index = schema.enum.findIndex((candidate) => Object.is(candidate, value));
	return index < 0 ? undefined : stringArray(schema['x-enumNames'])?.[index];
}
