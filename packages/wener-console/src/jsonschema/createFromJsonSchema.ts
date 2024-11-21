import { set } from 'es-toolkit/compat';
import type { JSONSchema7 } from 'json-schema';

/**
 *  Returns an Object containing all defaults from a schema
 */
export function createFromJsonSchema(root: JSONSchema7): unknown {
  // https://github.com/mdornseif/json-schema-default/blob/main/src/lib/json-schema-default.ts
  const out: any = root.default || {};
  let schema = root;

  const handle = ({
    schema,
    path,
    required,
  }: {
    schema: JSONSchema7 | undefined;
    path: string[];
    parent?: JSONSchema7;
    required?: boolean;
  }) => {
    if (!schema) return;

    if (schema.default !== undefined) {
      set(out, path, schema.default);
    } else if (required) {
      let def = null;
      switch (schema.type) {
        case 'string':
          def = '';
          break;
        case 'number':
          def = 0;
          break;
        case 'boolean':
          def = false;
          break;
        case 'array':
          def = [];
          break;
        case 'object':
          def = {};
          break;
      }
      set(out, path, def);
    }

    switch (schema.type) {
      case 'object':
        if (schema.properties) {
          let keys = schema.required || Object.keys(schema.properties);
          for (const key of keys) {
            let property = schema.properties[key];
            typeof property === 'object' &&
              handle({
                schema: property,
                path: path.concat(key),
                parent: schema,
                required: schema.required?.includes(key),
              });
          }
        }
        break;
      case 'array':
        if (schema.items) {
          if (schema.default) {
            set(out, path, schema.default);
          }
        }
        break;
    }
  };

  handle({
    schema,
    path: [],
  });

  return out;
}
