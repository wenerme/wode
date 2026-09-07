import type { QueryField, QueryFieldKind, QueryJsonValue, QueryOption } from './query-model';
import { isQueryJsonValue } from './query-model';
import { resolveSchema } from './query-json-schema-resolution';
import type {
	QueryFieldsFromJsonSchemaOptions,
	QueryFieldsFromJsonSchemaResult,
	QueryJsonSchema,
	QueryJsonSchemaExtension,
	QuerySchemaDiagnostic,
	QuerySchemaFieldContext,
} from './query-json-schema-types';
import {
	decodePointer,
	diagnostic,
	humanize,
	isFieldKind,
	isPrimitiveArray,
	isQueryJsonPrimitive,
	isRecord,
	isSchemaArray,
	normalizedTypes,
	numberValue,
	primitiveMatchesType,
	stringArray,
	stringValue,
	toPointer,
} from './query-json-schema-utils';

export * from './query-json-schema-types';

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
	return { fields, diagnostics };
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
	if (isQueryJsonPrimitive(schema.const)) sources.push([{ value: schema.const, label: String(schema.const) }]);
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
				options.push({ value, label: stringValue(resolved.schema.title) ?? String(value) });
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
		if (!options.length) {
			diagnostics.push(
				diagnostic('invalid-schema', 'error', toPointer(segments), 'oneOf has no constants allowed by its type.'),
			);
			return { valid: false };
		}
		sources.push(options);
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
