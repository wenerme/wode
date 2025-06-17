import { omit, remove } from 'es-toolkit';
import { match, P } from 'ts-pattern';
import { z } from 'zod/v4';
import type { JsonSchemaDef } from '../jsonschema';
import { getSchemaCache } from './getSchemaCache';
import type { TypeSchema } from './TypeSchema';
import { isTypeBoxSchema, isZodSchema } from './validate';

export function toJsonSchema(schema: TypeSchema): JsonSchemaDef {
	if (isZodSchema(schema)) {
		return getSchemaCache(schema, 'jsonschema', () => {
			// zod v4
			let js = z.toJSONSchema(schema, {
				unrepresentable: 'any',
				override: ({ zodSchema, jsonSchema: js }) => {
					const def = zodSchema._zod.def;
					const meta = z.globalRegistry.get(zodSchema);
					if (meta) {
						Object.assign(js, meta);
					}
					switch (def.type) {
						case 'union':
							if (zodSchema._zod.traits.has('ZodDiscriminatedUnion')) {
								resolveDiscriminator(js as JsonSchemaDef);
							}
							break;
						case 'nonoptional':
							// js._ref maybe true
							js.nullable = false;
							break;
						case 'nullable':
						case 'optional':
							// prefer nullable
							match(js)
								.with({ anyOf: [P.select(), { type: 'null' }] }, (select) => {
									delete js['anyOf'];
									Object.assign(js, select);
									js.nullable = true;
								})
								.otherwise((js) => {
									js.nullable = true;
								});
							break;
					}
				},
			}) as JsonSchemaDef;

			// remove redundant nullable, ensure required is sorted
			visit(js, (v) => {
				if (v.nullable === false) {
					delete v.nullable;
				}
				if (v.required) {
					v.required.sort();
				}
			});
			// maybe freeze
			return js;
		});
	}

	if (isTypeBoxSchema(schema)) {
		return schema as JsonSchemaDef;
	}

	return schema as JsonSchemaDef;
}

function visit(js: JsonSchemaDef, f: (js: JsonSchemaDef) => void) {
	const _visit = (
		js: JsonSchemaDef,
		f: (js: JsonSchemaDef) => void,
		parent: JsonSchemaDef | undefined,
		path: string[],
		k?: string,
	) => {
		if (!js) {
			return;
		}
		f(js);
		if (js.properties) {
			for (const [k, v] of Object.entries(js.properties)) {
				if (v) {
					_visit(v, f, js, path.concat(k), 'properties');
				}
			}
		} else if (js.items) {
			if (Array.isArray(js.items)) {
				for (const v of js.items) {
					_visit(v, f, js, path, 'items');
				}
			} else {
				_visit(js.items, f, js, path, 'items');
			}
		} else if (js.anyOf) {
			for (const v of js.anyOf) {
				_visit(v, f, js, path, 'anyOf');
			}
		} else if (js.oneOf) {
			for (const v of js.oneOf) {
				_visit(v, f, js, path, 'oneOf');
			}
		} else if (js.allOf) {
			for (const v of js.allOf) {
				_visit(v, f, js, path, 'allOf');
			}
		}
	};
	_visit(js, f, undefined, []);
}

function resolveJsonSchemaDef(
	js: JsonSchemaDef,
	ctx?: {
		parent: JsonSchemaDef;
		key: string;
	},
) {
	return match(js)
		.with(
			{
				anyOf: [P.select(), { type: 'null' }],
			},
			(select) => {
				return { ...omit(js, ['anyOf']), ...select, nullable: true };
			},
		)
		.with({ properties: P.nonNullable }, (schema: JsonSchemaDef) => {
			for (const key in schema.properties) {
				const prop = schema.properties[key];
				if (prop) {
					schema.properties[key] = resolveJsonSchemaDef(prop, { parent: schema, key });
				}
			}
			return schema;
		})
		.otherwise(() => {
			return js;
		});
}

function resolveDiscriminator(jsd: JsonSchemaDef) {
	if (!(jsd.anyOf && jsd.anyOf.length > 1)) {
		return;
	}
	if (jsd.discriminator) {
		return;
	}

	let names: string[] = [];
	{
		// candidate for discriminator
		const v = jsd.anyOf[0];
		if (v && v.type === 'object' && v.properties) {
			if (Array.isArray(v.required)) {
				for (const k of v.required) {
					if (v.properties[k].const !== undefined) {
						names.push(k);
					}
				}
			}
		}
	}
	if (names.length >= 1) {
		for (let i = 0; i < jsd.anyOf.length; i++) {
			if (i === 0) {
				// skip first
				continue;
			}
			if (!names.length) {
				break;
			}

			const v = jsd.anyOf[i];
			if (v && v.type === 'object' && v.properties) {
				const props = v.properties;
				remove(names, (k) => {
					// dont care the mapping
					let p = props[k];
					switch (typeof p.const) {
						case 'string':
						case 'number':
						case 'boolean':
							return false;
						default:
							return true;
					}
				});
			} else {
				names = [];
				break;
			}
		}
	}
	if (names.length === 1) {
		jsd.discriminator = {
			propertyName: names[0],
		};
	}
}
