import { deepFreeze } from '@wener/utils';
import { getSchemaCache } from './getSchemaCache';
import { SchemaRegistry } from './SchemaRegistry';
import type { TypeSchema } from './TypeSchema';

export function getSchemaOptions(s: TypeSchema): Array<{ value: string; label: string }> {
	let js = SchemaRegistry.get(s);
	return getSchemaCache(s, 'options', () => {
		let out =
			(js.anyOf || js.oneOf)?.map((v: any) => {
				let value = v.const;
				return {
					label: String(v.description || v.title || value),
					value: value ? String(value) : '',
				};
			}) || [];
		out = deepFreeze(out);
		return out;
	});
}

export function getSchemaOptionLabel(schema: TypeSchema, value: string | undefined | null): string | undefined {
	return getSchemaOptions(schema).find((v) => v.value === value)?.label;
}
