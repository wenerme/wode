import type { TObject, TSchema } from '@sinclair/typebox';

export function renderJsonSchemaToMarkdownDoc(rootSchema: any) {
  // markdown
  const out: string[] = [];
  const all = new Set();
  const pending: TSchema[] = [];

  const addObject = (o: TSchema) => {
    if (all.has(o.$id)) {
      return;
    }
    all.add(o.$id);
    pending.push(o);
  };

  const writeObjectProps = (T: TObject, { prefix = '' }: { prefix?: string } = {}) => {
    if (!T?.properties) {
      return;
    }
    for (const [name, schema] of Object.entries(T.properties)) {
      let typ = schema.$id || schema.type;

      if (typ === 'array') {
        typ = `${schema.items.$id || schema.items.type}[]`;
        if (schema.items.$id) {
          addObject(schema.items);
        }
      } else if (schema.$id) {
        addObject(schema);
      }
      if (!typ) {
        if ('anyOf' in schema) {
          typ = 'enum';
        }
      }

      out.push(`| ${prefix}${name} | ${typ} | ${schema.title || schema.description || ''} |`);

      if (typ === 'object') {
        writeObjectProps(schema as TObject, { prefix: `${prefix}${name}.` });
      } else if (schema.type === 'array') {
        if (schema.items.type === 'object' && !schema.items.$id) {
          writeObjectProps(schema.items as TObject, { prefix: `${prefix}${name}[].` });
        }
      }
    }
  };
  const writeObject = (T: TObject) => {
    out.push(`### ${T.title || T.$id}`);
    out.push(`
| $id | 名字 |
| --- | --- |
| ${T.$id || ''} | ${T.title || ''} | 
    `);
    if (T.description) {
      out.push('');
      out.push(`> ${T.description}`);
      out.push('');
    }

    out.push(`| 名字 | 类型 | 说明 |`);
    out.push(`| --- | --- | --- |`);

    writeObjectProps(T);

    out.push('');
  };

  writeObject(rootSchema);

  for (const schema of pending) {
    if (schema.type === 'object') {
      writeObject(schema as TObject);
    } else if ('anyOf' in schema) {
      out.push(`### ${schema.$id || schema.title}`);
      out.push(`
| $id | 名字 |
| --- | --- |
| ${schema.$id || ''} | ${schema.title || ''} | 
    `);

      out.push(`| 值 |  说明 |`);
      out.push(`| --- | --- |`);
      for (const item of schema.anyOf) {
        out.push(`| ${item.const} | ${item.title || item.description || ''} |`);
      }
      out.push('');
    }
  }

  return out.join('\n');
}
