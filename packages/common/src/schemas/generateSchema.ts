import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as Codegen from '@sinclair/typebox-codegen';

export async function generateSchema({ file, dir = path.dirname(file) }: { file: string; dir?: string }) {
  const fn = path.basename(file).replace(/\.d\.ts$/, '.ts');
  const types = await fs.readFile(file, 'utf-8');

  const typeboxDir = path.join(dir, 'typebox');
  const zodDir = path.join(dir, 'zod');

  await fs.mkdir(typeboxDir, { recursive: true });
  await fs.mkdir(zodDir, { recursive: true });

  const typeBoxFile = path.join(typeboxDir, fn);
  const zodFile = path.join(zodDir, fn);
  {
    let out = Codegen.TypeScriptToTypeBox.Generate(types);
    out = out.replace(/^import \{ Type, Static }/, `import { Type, type Static }`);
    await fs.writeFile(typeBoxFile, out);
  }
  const model = Codegen.TypeScriptToModel.Generate(types);
  await fs.writeFile(zodFile, Codegen.ModelToZod.Generate(model));

  await new Promise((resolve, reject) => {
    exec(`pnpm prettier --write "${dir}/{typebox,zod}/*.ts"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error);
        return;
      }
      resolve({ stderr, stdout });
      stdout && console.log(`prettier:stdout: ${stdout}`);
      stderr && console.error(`prettier:stderr: ${stderr}`);
    });
  });
}
