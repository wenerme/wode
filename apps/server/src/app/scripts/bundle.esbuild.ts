import * as esbuild from 'esbuild';
import { DynamicImport } from './DynamicImport';
import esbuildPluginTsc from './esbuild-plugin-tsc';

const SERVER = process.env.SERVER;
if (!SERVER) {
  throw new Error(`No server to bundle`);
}

await Promise.all(
  SERVER.split(',')
    .map((v) => v.trim())
    .map((v) => bundle(v)),
);

async function bundle(server: string) {
  const result = await esbuild.build({
    //entryPoints: [`./dist/out/apps/${server}/main.js`], // for swc handle decorator
    entryPoints: [`./src/apps/${server}/main.ts`],
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
    outfile: `dist/apps/${server}/main.mjs`,
    format: 'esm',
    platform: 'node',
    charset: 'utf8',
    target: 'chrome90',
    sourcemap: true,
    legalComments: 'external',
    // https://mikro-orm.io/docs/next/deployment#excluding-dependencies-from-esbuild
    // 支持 @nestjs/* 写法，但是需要 app 预先安装
    external: [
      'jsdom',
      'canvas',
      'bcrypt',
      'sharp',
      // https://mikro-orm.io/docs/next/deployment#excluding-dependencies-from-esbuild
      '@mikro-orm/mongodb',
      '@mikro-orm/mysql',
      '@mikro-orm/sqlite',
      '@mikro-orm/better-sqlite',
      '@mikro-orm/mariadb',
      '@mikro-orm/entity-generator',
      '@mikro-orm/migrations',
      '@mikro-orm/seeder',
      //
      '@nestjs/platform-express',
      '@nestjs/microservices',
      '@nestjs/websockets',
      //
      '@vscode/sqlite3',
      'sqlite3',
      'better-sqlite3',
      'mysql2',
      'mysql',
      'oracledb',
      'tedious',
      'pg-native',
      'pg-query-stream',
      //
      'class-transformer',
      '@fastify/view',
      //
      'ts-morph',
      'fsevents',
    ],
    plugins: [
      // https://github.com/RTVision/esbuild-dynamic-import/blob/master/src/index.ts
      // 本来只支持 default，改成了 import * as _DynamicImportModule
      DynamicImport({
        transformExtensions: ['.js'],
      }),
      esbuildPluginTsc(),
    ],
  });
  return result;
}
