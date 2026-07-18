import type { QueryField, QueryFieldKind, QueryJsonPrimitive, QueryJsonValue, QueryOption } from './query-model';
import { isQueryJsonValue } from './query-model';

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

type FieldRecord = { field: QueryField; order: number; index: number };

const extensionKeys = new Set([
	'label',
	'editor',
	'operators',
	'hidden',
	'group',
	'order',
	'placeholder',
	'field',
	'leaf',
	'kind',
]);

export function queryFieldsFromJsonSchema(
	schema: QueryJsonSchema,
	options: QueryFieldsFromJsonSchemaOptions = {},
): QueryFieldsFromJsonSchemaResult {
	const diagnostics: QuerySchemaDiagnostic[] = [];
	const records: FieldRecord[] = [];
	const requestedMaxDepth = options.maxDepth;
	const maxDepth =
		Number.isInteger(requestedMaxDepth) && Number(requestedMaxDepth) >= 0 ? Math.min(Number(requestedMaxDepth), 64) : 8;
	let index = 0;

	function visitObject(
		input: QueryJsonSchema,
		segments: string[],
		inheritedGroup: string | undefined,
		depth: number,
		refStack: readonly string[],
	) {
		if (depth > maxDepth) {
			diagnostics.push(
				diagnostic('max-depth', 'error', toPointer(segments), `Schema nesting exceeds ${maxDepth} levels.`),
			);
			return;
		}
		const resolved = resolveSchema(input, schema, refStack, segments, diagnostics);
		if (!resolved) return;
		const properties = resolved.schema.properties;
		if (properties === undefined) {
			diagnostics.push(
				diagnostic('invalid-schema', 'warning', toPointer(segments), 'Object schema has no properties.'),
			);
			return;
		}
		if (!isRecord(properties)) {
			diagnostics.push(
				diagnostic('invalid-schema', 'error', toPointer(segments), 'Schema properties must be an object map.'),
			);
			return;
		}
		const required = new Set(stringArray(resolved.schema.required) ?? []);
		for (const [propertyName, rawProperty] of Object.entries(properties)) {
			const propertySegments = [...segments, propertyName];
			const propertyPath = toPointer(propertySegments);
			const property = resolveSchema(rawProperty, schema, resolved.stack, propertySegments, diagnostics);
			if (!property) continue;
			const extension = readExtension(property.schema, propertyPath, diagnostics);
			if (extension.hidden) continue;
			const objectLike = isObjectSchema(property.schema);
			const explicitGroup = stringValue(extension.group);
			if (objectLike && !extension.leaf) {
				visitObject(
					property.schema,
					propertySegments,
					explicitGroup ?? property.schema.title ?? inheritedGroup,
					depth + 1,
					property.stack,
				);
				continue;
			}

			let field = createField(
				property.schema,
				propertyName,
				propertyPath,
				explicitGroup ?? inheritedGroup,
				required.has(propertyName),
				extension,
				schema,
				property.stack,
				diagnostics,
			);
			if (!field) continue;
			const overrides = options.fieldOverrides;
			const namedOverride = overrides && Object.hasOwn(overrides, field.name) ? overrides[field.name] : undefined;
			const pathOverride = overrides && Object.hasOwn(overrides, propertyPath) ? overrides[propertyPath] : undefined;
			const override = namedOverride ?? pathOverride;
			if (override) field = { ...field, ...override, name: override.name ?? field.name };
			const context: QuerySchemaFieldContext = {
				path: propertyPath,
				segments: propertySegments,
				schema: property.schema,
				field,
			};
			if (options.include && !options.include(context)) continue;
			if (options.mapField) {
				const mapped = options.mapField(context);
				if (!mapped) continue;
				field = mapped;
			}
			records.push({ field, order: numberValue(extension.order) ?? Number.MAX_SAFE_INTEGER, index });
			index += 1;
		}
	}

	const root = resolveSchema(schema, schema, [], [], diagnostics);
	if (root) visitObject(root.schema, [], root.schema.title, 0, root.stack);
	const seenFields = new Set<string>();
	const fields = records
		.toSorted((left, right) => left.order - right.order || left.index - right.index)
		.flatMap((record) => {
			if (seenFields.has(record.field.name)) {
				diagnostics.push(
					diagnostic(
						'duplicate-field',
						'error',
						String(record.field.meta?.schemaPath ?? record.field.name),
						`Duplicate query field name: ${record.field.name}.`,
					),
				);
				return [];
			}
			seenFields.add(record.field.name);
			return [record.field];
		});
	return {
		fields,
		diagnostics,
	};
}

function createField(
	schema: QueryJsonSchema,
	propertyName: string,
	path: string,
	group: string | undefined,
	required: boolean,
	extension: QueryJsonSchemaExtension,
	root: QueryJsonSchema,
	refStack: readonly string[],
	diagnostics: QuerySchemaDiagnostic[],
): QueryField | undefined {
	const pathSegments = decodePointer(path);
	const optionResult = readOptions(schema, root, refStack, pathSegments, diagnostics);
	if (!optionResult.valid) return undefined;
	const options = optionResult.options;
	const kind = isFieldKind(extension.kind) ? extension.kind : inferKind(schema, options);
	const item =
		schema.items !== undefined
			? resolveSchema(schema.items, root, refStack, [...pathSegments, 'items'], diagnostics)
			: undefined;
	if (schema.items !== undefined && !item) return undefined;
	const itemOptionResult = item
		? readOptions(item.schema, root, item.stack, [...pathSegments, 'items'], diagnostics)
		: { valid: true as const, options: undefined };
	if (!itemOptionResult.valid) return undefined;
	const itemOptions = itemOptionResult.options;
	const itemKind = item ? inferKind(item.schema, itemOptions) : undefined;
	const meta: Record<string, QueryJsonValue> = {};
	const format = stringValue(schema.format);
	if (format) meta.format = format;
	meta.schemaPath = path;
	return {
		name: stringValue(extension.field) ?? path,
		label: stringValue(extension.label) ?? stringValue(schema.title) ?? humanize(propertyName),
		description: stringValue(schema.description),
		kind,
		group,
		required,
		operators: stringArray(extension.operators),
		defaultValue: schema.default !== undefined && isQueryJsonValue(schema.default) ? schema.default : undefined,
		options: kind === 'array' ? itemOptions : options,
		itemKind,
		editor: stringValue(extension.editor),
		placeholder: stringValue(extension.placeholder),
		meta,
	};
}

function resolveSchema(
	input: unknown,
	root: QueryJsonSchema,
	stack: readonly string[],
	segments: readonly string[],
	diagnostics: QuerySchemaDiagnostic[],
): { schema: QueryJsonSchema; stack: readonly string[] } | undefined {
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
			Object.defineProperty(output, key, {
				value: next,
				enumerable: true,
				configurable: true,
				writable: true,
			});
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
		!effectiveTypes.some((type) => primitiveMatchesType(mergedConst as QueryJsonPrimitive, type))
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
			if (merged) {
				Object.defineProperty(output, key, {
					value: merged,
					enumerable: true,
					configurable: true,
					writable: true,
				});
			} else delete output[key];
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
	const merged = {
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
	};
	return valid ? merged : undefined;
}

function validateSchemaShape(
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

function readExtension(schema: QueryJsonSchema, path: string, diagnostics: QuerySchemaDiagnostic[]) {
	const raw: unknown = schema['x-query'];
	if (raw === undefined) return {};
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		diagnostics.push(diagnostic('invalid-extension', 'warning', path, 'x-query must be an object.'));
		return {};
	}
	const source = raw as Record<string, unknown>;
	const extension: QueryJsonSchemaExtension = {};
	for (const key of Object.keys(source)) {
		if (!extensionKeys.has(key))
			diagnostics.push(diagnostic('unknown-extension', 'warning', path, `Unknown x-query key: ${key}.`));
	}
	for (const key of ['label', 'editor', 'group', 'placeholder', 'field'] as const) {
		if (source[key] === undefined) continue;
		const value = stringValue(source[key]);
		if (value) extension[key] = value;
		else
			diagnostics.push(diagnostic('invalid-extension', 'warning', path, `x-query.${key} must be a non-empty string.`));
	}
	for (const key of ['hidden', 'leaf'] as const) {
		if (source[key] === undefined) continue;
		if (typeof source[key] === 'boolean') extension[key] = source[key];
		else diagnostics.push(diagnostic('invalid-extension', 'warning', path, `x-query.${key} must be a boolean.`));
	}
	if (source.order !== undefined) {
		const order = numberValue(source.order);
		if (order !== undefined) extension.order = order;
		else diagnostics.push(diagnostic('invalid-extension', 'warning', path, 'x-query.order must be a finite number.'));
	}
	if (source.operators !== undefined) {
		const operators = stringArray(source.operators);
		if (operators) extension.operators = operators;
		else
			diagnostics.push(
				diagnostic('invalid-extension', 'warning', path, 'x-query.operators must be a dense array of strings.'),
			);
	}
	if (source.kind !== undefined) {
		if (isFieldKind(source.kind)) extension.kind = source.kind;
		else
			diagnostics.push(diagnostic('invalid-extension', 'warning', path, 'x-query.kind is not a supported field kind.'));
	}
	return extension;
}

function enumValueLabel(schema: QueryJsonSchema, value: QueryJsonPrimitive) {
	if (!isPrimitiveArray(schema.enum)) return undefined;
	const index = schema.enum.findIndex((candidate) => Object.is(candidate, value));
	return index < 0 ? undefined : stringArray(schema['x-enumNames'])?.[index];
}

function readOptions(
	schema: QueryJsonSchema,
	root: QueryJsonSchema,
	stack: readonly string[],
	segments: readonly string[],
	diagnostics: QuerySchemaDiagnostic[],
): { valid: boolean; options?: QueryOption[] } {
	const types = normalizedTypes(schema.type);
	const sources: QueryOption[][] = [];
	if (isPrimitiveArray(schema.enum)) {
		const names = stringArray(schema['x-enumNames']);
		const options = schema.enum.flatMap((value, index) =>
			types.length && !types.some((type) => primitiveMatchesType(value, type))
				? []
				: [{ value, label: names?.[index] ?? String(value) }],
		);
		if (!options.length) {
			diagnostics.push(
				diagnostic('invalid-schema', 'error', toPointer(segments), 'Schema enum has no values allowed by its type.'),
			);
			return { valid: false };
		}
		sources.push(options);
	}
	if (isQueryJsonPrimitive(schema.const)) {
		sources.push([{ value: schema.const, label: String(schema.const) }]);
	}
	if (isSchemaArray(schema.oneOf)) {
		const options: QueryOption[] = [];
		let finite = true;
		for (let index = 0; index < schema.oneOf.length; index += 1) {
			const resolved = resolveSchema(
				schema.oneOf[index],
				root,
				stack,
				[...segments, 'oneOf', String(index)],
				diagnostics,
			);
			if (!resolved) return { valid: false };
			const value = resolved.schema.const;
			if (!isQueryJsonPrimitive(value)) {
				finite = false;
				continue;
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
				return { valid: false };
			}
			if (!types.length || types.some((type) => primitiveMatchesType(value, type))) {
				options.push({
					value,
					label: stringValue(resolved.schema.title) ?? String(value),
				});
			}
		}
		if (!finite) {
			diagnostics.push(
				diagnostic(
					'invalid-schema',
					'error',
					toPointer(segments),
					'Only finite const-based oneOf schemas can become query options.',
				),
			);
			return { valid: false };
		}
		if (finite) {
			if (!options.length) {
				diagnostics.push(
					diagnostic('invalid-schema', 'error', toPointer(segments), 'oneOf has no constants allowed by its type.'),
				);
				return { valid: false };
			}
			sources.push(options);
		}
	}
	if (!sources.length) return { valid: true };
	const options = sources[0].filter((option) =>
		sources.slice(1).every((source) => source.some((candidate) => Object.is(candidate.value, option.value))),
	);
	if (!options.length) {
		diagnostics.push(
			diagnostic('invalid-schema', 'error', toPointer(segments), 'Schema value constraints have no intersection.'),
		);
		return { valid: false };
	}
	return { valid: true, options };
}

function inferKind(schema: QueryJsonSchema, options?: readonly QueryOption[]): QueryFieldKind {
	if (normalizedTypes(schema.type).includes('array')) return 'array';
	if (options?.length) return 'enum';
	if (schema.format === 'date') return 'date';
	if (schema.format === 'date-time') return 'datetime';
	const type = normalizedTypes(schema.type).find((candidate) => candidate !== 'null');
	if (type === 'string' || type === 'number' || type === 'integer' || type === 'boolean') return type;
	return 'unknown';
}

function isObjectSchema(schema: QueryJsonSchema) {
	return normalizedTypes(schema.type).includes('object') || Boolean(schema.properties);
}

function normalizedTypes(type: QueryJsonSchema['type']) {
	if (typeof type === 'string') return [type];
	if (!Array.isArray(type)) return [];
	const output: string[] = [];
	for (let index = 0; index < type.length; index += 1) {
		if (!(index in type) || typeof type[index] !== 'string') return [];
		output.push(type[index]);
	}
	return output;
}

function intersectSchemaTypes(left: readonly string[], right: readonly string[]) {
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

function toPointer(segments: readonly string[]) {
	return segments.length ? `/${segments.map(encodePointerSegment).join('/')}` : '';
}

function decodePointer(pointer: string) {
	return pointer ? pointer.slice(1).split('/').map(decodePointerSegment) : [];
}

function encodePointerSegment(value: string) {
	return value.replaceAll('~', '~0').replaceAll('/', '~1');
}

function decodePointerSegment(value: string) {
	return value.replaceAll('~1', '/').replaceAll('~0', '~');
}

function humanize(value: string) {
	const label = value
		.replace(/([a-z\d])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.trim();
	return label ? label[0].toUpperCase() + label.slice(1) : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
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

function hasSchemaObjectCycle(value: unknown): boolean {
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
	const allowed = new Set(['null', 'object', 'array', 'string', 'number', 'integer', 'boolean']);
	if (typeof value === 'string') return allowed.has(value);
	if (!Array.isArray(value) || value.length === 0) return false;
	for (let index = 0; index < value.length; index += 1) {
		if (!(index in value) || typeof value[index] !== 'string' || !allowed.has(value[index])) return false;
	}
	return true;
}

function isQueryJsonPrimitive(value: unknown): value is QueryJsonPrimitive {
	return (
		value === null ||
		typeof value === 'string' ||
		typeof value === 'boolean' ||
		(typeof value === 'number' && Number.isFinite(value))
	);
}

function primitiveMatchesType(value: QueryJsonPrimitive, type: string) {
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

function isPrimitiveArray(value: unknown): value is readonly QueryJsonPrimitive[] {
	if (!Array.isArray(value) || value.length === 0) return false;
	for (let index = 0; index < value.length; index += 1) {
		if (!(index in value) || !isQueryJsonPrimitive(value[index])) return false;
	}
	return true;
}

function isSchemaArray(value: unknown): value is readonly QueryJsonSchema[] {
	if (!Array.isArray(value) || value.length === 0) return false;
	for (let index = 0; index < value.length; index += 1) {
		if (!(index in value) || !isRecord(value[index])) return false;
	}
	return true;
}

function stringValue(value: unknown) {
	return typeof value === 'string' && value.trim() ? value : undefined;
}

function numberValue(value: unknown) {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringArray(value: unknown) {
	if (!Array.isArray(value)) return undefined;
	for (let index = 0; index < value.length; index += 1) {
		if (!(index in value) || typeof value[index] !== 'string') return undefined;
	}
	return value as string[];
}

function isFieldKind(value: unknown): value is QueryFieldKind {
	return (
		typeof value === 'string' &&
		['string', 'number', 'integer', 'boolean', 'date', 'datetime', 'enum', 'array', 'unknown'].includes(value)
	);
}

function diagnostic(
	code: QuerySchemaDiagnosticCode,
	severity: QuerySchemaDiagnostic['severity'],
	path: string,
	message: string,
	ref?: string,
): QuerySchemaDiagnostic {
	return { code, severity, path, message, ref };
}
