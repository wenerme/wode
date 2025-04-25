import type { JsonSchemaDef } from '../jsonschema';
import type { TypeSchema } from './TypeSchema';

type SchemaCache = {
	jsonschema?: JsonSchemaDef;
	options?: Array<{ value: string; label: string }>;
};
const _cache = new WeakMap<any, SchemaCache>();

export function getSchemaCache<K extends keyof SchemaCache>(
	obj: TypeSchema,
	key: K,
	compute: () => NonNullable<SchemaCache[K]>,
): NonNullable<SchemaCache[K]> {
	let c = _cache.get(obj);
	if (!c) {
		c = {};
		_cache.set(obj, c);
	}
	return (c[key] ??= compute());
}
