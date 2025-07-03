import { getGlobalStates } from '@wener/utils';
import type { JsonSchemaDef } from '../jsonschema';
import { toJsonSchema, type SchemaOutput, type TypeSchema } from './index';

const types = getGlobalStates('@wener/common/resource/schema/SchemaRegistry', () => new Map<string, JsonSchemaDef>());

export function get(name: string): JsonSchemaDef;
export function get<S extends TypeSchema>(schema: S): JsonSchemaDef<SchemaOutput<S>>;
export function get(needle: TypeSchema | string) {
	let key = getKey(needle);
	let found = types.get(key);
	if (found) {
		return found;
	} else {
		if (needle && typeof needle !== 'string') {
			return toJsonSchema(needle);
		}
	}
	throw new Error(`Schema not found: ${key}`);
}

function getKey(s: TypeSchema | string) {
	let key;
	if (typeof s === 'string') {
		key = s;
	} else {
		let js = toJsonSchema(s);
		key = js.$id || js.title;
	}
	if (!key) {
		throw new Error(`Schema must have $id or title`);
	}
	return key;
}

export function set(key: TypeSchema | string, def: TypeSchema): void;
export function set(key: TypeSchema, def?: TypeSchema): void;
export function set(key: TypeSchema | string, def?: TypeSchema) {
	if (!def) {
		def = key as TypeSchema;
		if (!def || typeof def !== 'object') {
			throw new Error(`Invalid schema definition for: ${getKey(key)}`);
		}
	}
	types.set(getKey(key), toJsonSchema(def));
}
