import type { JsonSchemaDef } from './types';

export type VisitJsonSchemaContext = { path: string[]; parent?: JsonSchemaDef };

export function forEachJsonSchema(js: JsonSchemaDef, cb: (js: JsonSchemaDef, ctx: VisitJsonSchemaContext) => void) {
	const ctx: VisitJsonSchemaContext = { path: [] };
	const _visit = (
		js: JsonSchemaDef,
		_f: (js: JsonSchemaDef, ctx: VisitJsonSchemaContext) => void,
		parent: JsonSchemaDef | undefined,
		path: string[],
		_k?: string,
	) => {
		if (!js) {
			return;
		}
		ctx.path = path;
		ctx.parent = parent;
		_f(js, ctx);
		if (js.properties) {
			for (const [k, v] of Object.entries(js.properties)) {
				if (v) {
					_visit(v, _f, js, path.concat(k), 'properties');
				}
			}
		} else if (js.items) {
			// array should be `key[].subkey` or `key.*.subkey`?
			if (Array.isArray(js.items)) {
				for (const v of js.items) {
					_visit(v, _f, js, path, 'items');
				}
			} else {
				_visit(js.items, _f, js, path, 'items');
			}
		} else if (js.anyOf) {
			for (const v of js.anyOf) {
				_visit(v, _f, js, path, 'anyOf');
			}
		} else if (js.oneOf) {
			for (const v of js.oneOf) {
				_visit(v, _f, js, path, 'oneOf');
			}
		} else if (js.allOf) {
			for (const v of js.allOf) {
				_visit(v, _f, js, path, 'allOf');
			}
		}
	};
	_visit(js, cb, undefined, []);
}
