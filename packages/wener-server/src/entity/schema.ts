import 'reflect-metadata';
import { type EntityClass, type EntityProperty, MetadataStorage, type Type } from '@mikro-orm/core';
import type { JsonSchemaDef } from '@wener/common/jsonschema';
import { type AbstractConstructor, type Constructor, computeIfAbsent } from '@wener/utils';
import { Features } from '../Feature';

const ENTITY_FIELD_SCHEMA_METADATA_KEY = 'Entity:Field:Schema:Metadata:Options';
const ENTITY_SCHEMA_METADATA_KEY = 'Entity:Schema:Metadata:Options';

export type EntitySchemaOptions = {
	idType?: string;
	title?: string;
	description?: string;
	features?: string[];
	metadata?: Record<string, any>;
};

export const EntitySchema = (options: EntitySchemaOptions = {}): ClassDecorator => {
	return Reflect.metadata(ENTITY_SCHEMA_METADATA_KEY, options);
};

export type FieldSchemaOptions = {
	title?: string;
	description?: string;
	search?: boolean | 'exact'; // field is searchable
	format?: string;
	redact?: boolean; // field is redacted
	// pattern?: string | RegExp;
	schema?: JsonSchemaDef;
	metadata?: Record<string, any>;
};
export const FieldSchema = (options: FieldSchemaOptions = {}): PropertyDecorator => {
	return Reflect.metadata(ENTITY_FIELD_SCHEMA_METADATA_KEY, options);
};

let _cache = new WeakMap<object, any>();

export function getEntitySchema<T = unknown>(
	type: Constructor<T> | AbstractConstructor<T> | EntityClass<T> | Function,
): EntitySchemaDef {
	return computeIfAbsent(_cache, type, () => {
		// let lookup = computeIfAbsent<object, Map<any, EntityMetadata>>(_cache, MetadataStorage, () => {
		//   return new Map(Object.values(MetadataStorage.getMetadata()).map((v) => [v.className, v]));
		// });

		const getMeta = (name: string) => {
			return Object.values(MetadataStorage.getMetadata()).find((v) => v.className === name);
		};

		let protos = [];

		{
			let proto = type;
			while (proto) {
				protos.push(proto);
				proto = Object.getPrototypeOf(proto);
			}
		}

		let meta = getMeta(type.name)!;
		const schema: JsonSchemaDef = {
			title: meta.className.replace(/Entity$/, ''),
			description: meta.comment,
			type: 'object',
			properties: {},
		};
		const entitySchemaDef: EntitySchemaDef = {
			title: meta.comment,
			className: meta.className,
			typeName: meta.className.replace(/Entity$/, ''),
			tableName: meta.tableName,
			features: Features.getFeatures(type),
			metadata: {},
			fields: [],
			schema,
		};
		protos.reverse();
		for (const proto of protos) {
			if (proto) {
				let s = Reflect.getMetadata(ENTITY_SCHEMA_METADATA_KEY, proto) as EntitySchemaOptions;
				if (s) {
					entitySchemaDef.idType = s.idType;
					entitySchemaDef.title = s.title || entitySchemaDef.title;
					entitySchemaDef.features.push(...(s.features ?? []));
					Object.assign(entitySchemaDef.metadata, s.metadata);
				}
			}
			let meta = getMeta(proto.name);
			if (!meta) continue;
			for (let [fieldName, prop] of Object.entries((meta.properties ?? {}) as Record<string, EntityProperty>)) {
				if (!prop) continue;
				let fieldSchemaOptions: FieldSchemaOptions | undefined = proto.prototype
					? Reflect.getMetadata(ENTITY_FIELD_SCHEMA_METADATA_KEY, proto.prototype, fieldName)
					: undefined;
				let fieldJsonschemaDef: JsonSchemaDef = fieldSchemaOptions?.schema || {};
				let entityFieldSchemaDef: EntityFieldSchemaDef = {
					name: fieldName,
					type: '',
					nullable: prop.nullable ?? true,
					schema: fieldJsonschemaDef,
					metadata: {},
				};
				if (prop.comment) {
					entityFieldSchemaDef.title = prop.comment;
				}
				if (typeof prop.type === 'function') {
					let t: Type | undefined;
					try {
						t = new (prop.type as any)();
					} catch (e) {
						// handle reference ()=>"UserEntity"
						console.warn(`Failed to create type ${prop.type} of ${proto.name}.${prop.name}: ${e}`);
					}
					switch (t?.name) {
						case 'StringType':
							fieldJsonschemaDef.type = 'string';
							break;
						case 'UuidType':
							fieldJsonschemaDef.type = 'string';
							fieldJsonschemaDef.format = 'uuid';
							break;
						case 'Date':
						case 'DateTimeType':
							fieldJsonschemaDef.type = 'string';
							fieldJsonschemaDef.format = 'date-time';
							break;
						case 'number':
						case 'IntegerType':
							fieldJsonschemaDef.type = 'integer';
							break;
						case 'any':
						case 'JsonType':
							// efs.type = 'object';
							fieldJsonschemaDef.type = 'object';
							break;
						case 'BigIntType':
							fieldJsonschemaDef.type = 'string';
							fieldJsonschemaDef.format = 'bigint';
							break;
						default:
							// efs.type = t.runtimeType;
							fieldJsonschemaDef.type = t?.runtimeType as 'string';
					}
				}
				if (prop.hidden) {
					// fixme do not hide deletedAt
					if (entityFieldSchemaDef.name !== 'deletedAt') {
						entityFieldSchemaDef.redact = true;
					}
				}
				if (fieldSchemaOptions) {
					const { metadata, ...rest } = fieldSchemaOptions;
					Object.assign(entityFieldSchemaDef, rest);
					if (metadata) {
						Object.assign(entityFieldSchemaDef.metadata, metadata);
					}
				}
				if (entityFieldSchemaDef.nullable) {
					// fixme typing
					(fieldJsonschemaDef as { nullable?: boolean }).nullable = true;
				}
				entityFieldSchemaDef.title && (fieldJsonschemaDef.title ||= entityFieldSchemaDef.title);
				entityFieldSchemaDef.description && (fieldJsonschemaDef.description ||= entityFieldSchemaDef.description);
				if (prop.comment) {
					if (!fieldJsonschemaDef.title) {
						fieldJsonschemaDef.title = prop.comment;
					} else {
						fieldJsonschemaDef.description ||= prop.comment;
					}
				}
				if (prop.default !== undefined && prop.default !== null) {
					if (fieldJsonschemaDef.type === 'object' && typeof prop.default === 'string') {
						// ignore json case default
					} else {
						fieldJsonschemaDef.default = prop.default;
					}
				}
				if (entityFieldSchemaDef.title === entityFieldSchemaDef.description) {
					entityFieldSchemaDef.description = undefined;
				}

				if (fieldJsonschemaDef.title === fieldJsonschemaDef.description) {
					fieldJsonschemaDef.description = undefined;
				}
				entitySchemaDef.fields.push(entityFieldSchemaDef);
			}
			{
				// fixme define schema behavior on entity
				const metaFieldNames = ['id', 'uid', 'tid', 'sid', 'attributes', 'properties', 'extensions'];
				const schema = entitySchemaDef.schema;
				for (let field of entitySchemaDef.fields) {
					schema.properties![field.name] = field.schema;
				}
				const required = entitySchemaDef.fields
					.filter((v) => !v.nullable)
					.filter((v) => !metaFieldNames.includes(v.name))
					.map((v) => v.name);
				if (required.length) {
					schema.required = required;
				}
			}
		}
		entitySchemaDef.features = Array.from(new Set(entitySchemaDef.features)).sort();
		return entitySchemaDef;
	});
}

export type EntitySchemaDef = {
	idType?: string;
	title?: string;
	description?: string;
	className: string;
	typeName: string;
	tableName: string;
	features: string[];
	schema: JsonSchemaDef;
	fields: EntityFieldSchemaDef[];
	metadata: Record<string, any>;
};

export type EntityFieldSchemaDef = {
	title?: string;
	description?: string;
	name: string;
	type: string;
	format?: string;
	nullable: boolean;
	schema: JsonSchemaDef;
	redact?: boolean;
	search?: boolean | 'exact';
	metadata: Record<string, any>;
};
