import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import { pascalCase } from '@wener/utils';
import { test } from 'vitest';
import { ApiDoc, Schema } from './spec';

test(
  'gen',
  async () => {
    // return
    const gen = async ({ product, version }: { product: string; version: string }) => {
      let doc;
      try {
        doc = JSON.parse(await fs.readFile(`./ignored/${product}-${version}.json`, 'utf-8'));
      } catch (e) {
        console.log(`Fetch ${product} ${version}`);
        const res = await fetch(
          `https://next.api.aliyun.com/meta/v1/products/${product}/versions/${version}/api-docs.json`,
        );
        doc = await res.json();
        await fs.writeFile(`./ignored/${product}-${version}.json`, JSON.stringify(doc, null, 2));
      }
      const { ns: nsName, out } = writeApi(doc);
      await fs.writeFile(`./src/alicloud/${nsName}.ts`, out.join('\n'));
      await new Promise((resolve) => exec(`pnpm prettier --write ./src/alicloud/${nsName}.ts`, {}, resolve));
    };
    await gen({
      product: 'Dytnsapi',
      version: '2020-02-17',
    });
    await gen({
      product: 'ocr-api',
      version: '2021-07-07',
    });
  },
  { timeout: 60 * 5 * 1000 },
);

function writeField({ name, schema, out = [] }: { name: string; schema: Schema; out?: Array<any> }) {
  let type = schema.type;
  switch (type) {
    case 'string':
      {
        if (schema.format === 'binary') {
          type += '| BufferSource';
        }
      }
      break;
    case 'integer':
      type = 'number';
      break;
    case 'array':
      type = 'Array<';
      if (schema.items?.description) type += `/** ${schema.items?.description} */`;
      type += schema.items?.type ?? 'any';
      type += '>';
      break;
  }
  out.push(`  ${name}${schema.required ? '' : '?'}: ${type};`);
  return;
}

function writeApi(doc: ApiDoc) {
  const out = [];
  const ext = [];
  let nsName;
  let interfaceName;

  out.push(`
import { AliCloudClientOptions } from './AliCloudClient';
`);

  {
    const { product, version } = doc.info;
    nsName = pascalCase([product.replace(/api$/, ''), `V${version.replace(/-/g, '')}`].join(' '));
    interfaceName = `${nsName}Api`;
    // out.push(`export namespace ${nsName} {`);
    out.push(`
    export interface ${interfaceName} {
      $product: '${product}';
      $version: '${version}';
    `);
  }

  {
    for (let [name, v] of Object.entries(doc.apis)) {
      const { summary, deprecated, title, description, operationType } = v;
      out.push('/**');
      out.push(
        [
          summary.trim(),
          '  ',
          description ? [`@remarks`, '  ', title, description] : undefined,
          ' ',
          deprecated ? `@deprecated` : '',
          operationType === 'read' && `@readonly`,
          ' ',
          `@acs-operation-type ${operationType}`,
        ]
          .flat()
          .filter(Boolean)
          .map((v) => String(v).trim())
          .join('\n')
          .trim()
          .replace(/^/gm, '* '),
      );
      out.push('*/');
      out.push(`\t${name}(req: ${name}Request,opts?:AliCloudClientOptions): Promise<${name}Response>;`);
      ext.push(`export interface ${name}Request {`);

      {
        const { parameters } = v;
        for (let { name, in: _in, schema } of parameters) {
          if (_in === 'body' && name !== 'body') {
            throw new Error(`Invalid body name ${name}`);
          }
          ext.push('/**');
          const { title, description } = schema;
          ext.push(
            [title, description, `@acs-in ${_in}`]
              .flat()
              .filter(Boolean)
              .map((v) => String(v).trim())
              .join('\n')
              .trim()
              .replace(/^/gm, '* '),
          );
          ext.push('*/');
          writeField({ name, schema: schema, out: ext });
        }
      }

      ext.push('}');
      ext.push(`export interface ${name}Response {`);
      {
        let schema = v.responses['200'].schema;
        for (const [name, vs] of Object.entries(schema.properties)) {
          ext.push('/**');
          const { title, description } = vs;
          ext.push(
            [title, description]
              .flat()
              .filter(Boolean)
              .map((v) => String(v).trim())
              .join('\n')
              .trim()
              .replace(/^/gm, '* '),
          );
          ext.push('*/');
          writeField({ name, schema: vs, out: ext });
        }
      }
      ext.push('}');
    }
  }

  // interface
  out.push('}');

  out.push(...ext);

  return {
    ns: nsName,
    out,
  };
}
