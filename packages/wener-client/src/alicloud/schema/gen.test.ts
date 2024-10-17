import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import { pascalCase } from '@wener/utils';
import { test } from 'vitest';
import { RecognizeIdcardRoot } from '../OcrV20210707.types';
import type { ApiDoc, TypeSchema } from './spec';

const alias: Record<string, string> = {
  RecognizeIdcardResponse: 'RecognizeIdcardRoot',
};

test(
  'gen',
  async () => {
    // return
    const gen = async ({ product, version }: { product: string; version: string }) => {
      let doc;
      try {
        doc = JSON.parse(await fs.readFile(`./ignored/${product}-${version}.json`, 'utf8'));
      } catch {
        console.log(`Fetch ${product} ${version}`);
        const res = await fetch(
          `https://next.api.aliyun.com/meta/v1/products/${product}/versions/${version}/api-docs.json`,
        );
        doc = await res.json();
        await fs.writeFile(`./ignored/${product}-${version}.json`, JSON.stringify(doc, null, 2));
      }

      const { ns: nsName, out } = writeApi(doc);
      await fs.writeFile(`./src/alicloud/${nsName}.ts`, out.join('\n'));
    };

    await gen({
      product: 'Dytnsapi',
      version: '2020-02-17',
    });
    await gen({
      product: 'ocr-api',
      version: '2021-07-07',
    });

    await new Promise((resolve) => exec('pnpm prettier --write ./src/alicloud/*.ts', {}, resolve));
  },
  { timeout: 60 * 5 * 1000 },
);

function writeField({ name, schema, out = [] }: { name: string; schema: TypeSchema; out?: any[] }) {
  out.push(`  ${name}${schema.required ? '' : '?'}: ${buildType(schema)};`);
}

function buildType(schema: TypeSchema) {
  let type = schema.type;
  switch (type) {
    case 'object': {
      {
        type = '{';
        for (const [name, vs] of Object.entries(schema.properties!)) {
          type += `\n/** ${vs.description} */\n${name}${vs.required ? '' : '?'}: ${buildType(vs)};`;
        }

        type += '\n}';
      }

      break;
    }

    case 'string': {
      {
        if (schema.format === 'binary') {
          type += '| BufferSource';
        }
      }

      break;
    }

    case 'integer': {
      type = 'number';
      break;
    }

    case 'array': {
      type = 'Array<';
      if (schema.items?.description) {
        type += `/** ${schema.items?.description} */`;
      }

      type += buildType(schema.items!);
      type += '>';
      break;
    }
  }

  return type;
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
    nsName = pascalCase([product.replace(/api$/, ''), `V${version.replaceAll('-', '')}`].join(' '));
    interfaceName = `${nsName}Api`;
    // out.push(`export namespace ${nsName} {`);
    out.push(`
    export interface ${interfaceName} {
      $product: '${product}';
      $version: '${version}';
    `);
  }

  {
    for (const [name, v] of Object.entries(doc.apis)) {
      const { summary, deprecated, title, description, operationType } = v;
      out.push('/**');
      out.push(
        [
          summary.trim(),
          '  ',
          description ? ['@remarks', '  ', title, description] : undefined,
          ' ',
          deprecated ? '@deprecated' : '',
          operationType === 'read' && '@readonly',
          ' ',
          `@acs-operation-type ${operationType}`,
        ]
          .flat()
          .filter(Boolean)
          .map((v) => String(v).trim())
          .join('\n')
          .trim()
          .replaceAll(/^/gm, '* '),
        '*/',
        `\t${name}(req: ${name}Request,opts?:AliCloudClientOptions): Promise<${name}Response>;`,
      );

      const requestName = `${name}Request`;
      const responseName = `${name}Response`;

      if (alias[requestName]) {
        out.unshift(`import {type ${alias[requestName]} from './${nsName}.types';`);
        ext.push(`export type ${name}Request = ${alias[requestName]};`);
      } else {
        ext.push(`export interface ${name}Request {`);

        {
          const { parameters } = v;
          for (const { name, in: _in, schema } of parameters) {
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
                .replaceAll(/^/gm, '* '),
              '*/',
            );
            writeField({ name, schema, out: ext });
          }
        }

        ext.push('}');
      }

      // response
      if (alias[responseName]) {
        out.unshift(`import {type ${alias[responseName]}} from './${nsName}.types';`);
        ext.push(`export type ${responseName} = ${alias[responseName]};`);
      } else {
        let schema = v.responses['200'].schema;
        // wrapper
        {
          const { Data, RequestId, Code, Message } = schema.properties || {};
          if (Data && Code && Message && RequestId) {
            schema = Data;
          }
        }

        if (schema.properties) {
          ext.push(`export interface ${name}Response {`);
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
                .replaceAll(/^/gm, '* '),
              '*/',
            );
            writeField({ name, schema: vs, out: ext });
          }

          ext.push('}');
        } else {
          // primitive
          if (schema.type === 'string') {
            // may unwrap to json
            ext.push(`export type ${name}Response = ${schema.type} | object;`);
          } else {
            ext.push(`export type ${name}Response = ${buildType(schema)};`);
          }
        }
      }
    }
  }

  // interface
  out.push('}', ...ext);

  return {
    ns: nsName,
    out,
  };
}
