import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { BuildOptions } from 'esbuild';
import { createDynamicImportPlugin } from './createDynamicImportPlugin';
import { createExcludeVendorSourceMapPlugin } from './createExcludeVendorSourceMapPlugin';
import { createTscPlugin } from './createTscPlugin';

export async function bundle(server: string, opts?: BuildOptions | ((o: BuildOptions) => BuildOptions | void)) {
  let entry: string | undefined;
  let out: string | undefined;
  let name = server;
  if (server.includes(':')) {
    [name, entry, out] = server.split(':');
  } else {
    const candidates = [server, `./src/apps/${server}/main.bun.ts`, `./src/apps/${server}/main.ts`];
    entry = candidates.find((v) => {
      try {
        fs.statSync(v);
        return true;
      } catch (e) {}
      return false;
    });
    if (!entry) {
      throw new Error(`No entry for ${server}`);
    }
  }

  if (name.includes('/')) {
    name = path.basename(entry);
    name = name.replace(/main(\.bun)?\.[tj]s/, '');
    if (!name) {
      name = entry.split('/').at(-2) || '';
    }
    name ||= 'server';
  }
  if (!out) {
    out = `dist/apps/${name}/main.mjs`;
  }
  let options: BuildOptions = {
    //entryPoints: [`./dist/out/apps/${server}/main.js`], // for swc handle decorator
    entryPoints: [entry],
    bundle: true,
    logLevel: 'info',
    banner: {
      js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);var __filename;var __dirname;{const {fileURLToPath} = await import('url');const {dirname} = await import('path');var __filename = fileURLToPath(import.meta.url); __dirname = dirname(__filename)};",
    },
    define: {
      NODE_ENV: JSON.stringify(`production`),
      __DEV__: JSON.stringify(false),
    },
    keepNames: true,
    minifySyntax: true,
    outfile: out,
    format: 'esm',
    platform: 'node',
    charset: 'utf8',
    target: 'node20',
    sourcemap: true,
    // 如果只需要 stack trace 则不需要 sourcesContent
    // https://esbuild.github.io/api/#sources-content
    sourcesContent: false,
    legalComments: 'external',
    // https://mikro-orm.io/docs/next/deployment#excluding-dependencies-from-esbuild
    // 支持 @nestjs/* 写法，但是需要 app 预先安装
    external: [
      // 'ws', // this is pure js, c++ addon bufferutil utf-8-validate
      'jsdom',
      'canvas',
      'bcrypt',
      'sharp',
      // https://mikro-orm.io/docs/next/deployment#excluding-dependencies-from-esbuild
      // 没有用到的依赖，以前版本会都依赖进来，但依赖可能不存在
      '@mikro-orm/mongodb',
      '@mikro-orm/sqlite',
      '@mikro-orm/better-sqlite',
      '@mikro-orm/mariadb',
      '@mikro-orm/entity-generator',
      '@mikro-orm/migrations',
      '@mikro-orm/seeder',
      // 没用到的功能模块
      '@nestjs/platform-express',
      '@nestjs/microservices',
      '@nestjs/websockets',
      '@fastify/view',
      'ts-morph',
      // binary
      '@vscode/sqlite3',
      'sqlite3',
      'better-sqlite3',
      'mysql2',
      'mysql',
      'oracledb',
      'tedious',
      'pg-native',
      'pg-query-stream',
      'fsevents',
      // 有问题
      'class-transformer',
    ],
    plugins: [
      createExcludeVendorSourceMapPlugin({ filter: /node_modules/ }),
      // https://github.com/RTVision/esbuild-dynamic-import/blob/master/src/index.ts
      // 本来只支持 default，改成了 import * as _DynamicImportModule
      createDynamicImportPlugin({
        transformExtensions: ['.js'],
      }),
      createTscPlugin(),
    ],
  };
  if (typeof opts === 'function') {
    options = opts(options) || options;
  } else if (opts) {
    Object.assign(options, opts);
  }
  return await esbuild.build(options);
}
