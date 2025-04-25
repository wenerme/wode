import { firstOfMaybeArray } from '@wener/utils';
import { toJsonSchema } from './toJsonSchema';
import type { TypeSchema } from './TypeSchema';

export function findJsonSchemaByPath(schema: TypeSchema, objectPath: string) {
	schema = toJsonSchema(schema);
	if (!objectPath || !schema) {
		return undefined;
	}

	const segments = objectPath.split('.');
	let currentSchema = schema;

	for (const segment of segments) {
		// 检查当前 schema 是否是对象类型且有 properties
		if (
			currentSchema
			&& typeof currentSchema === 'object'
			&& currentSchema.properties
			&& currentSchema.properties[segment]
		) {
			currentSchema = currentSchema.properties[segment];
			continue;
		}

		if (/^\d$/.test(segment) || segment === '[]') {
			if (currentSchema.items) {
				currentSchema = firstOfMaybeArray(currentSchema.items);
				continue;
			}
		}

		return undefined;
	}

	return currentSchema;
}
