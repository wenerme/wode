import * as esbuild from 'esbuild';

const SERVER = process.env.SERVER;

let result = await esbuild.build({
  entryPoints: [`./dist/out/apps/${SERVER}/main.js`],
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
  outfile: `dist/apps/${SERVER}/main.mjs`,
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
});
