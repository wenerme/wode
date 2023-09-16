import process from 'node:process';
import 'reflect-metadata';
import { inspect } from 'node:util';
import { MemoryCacheAdapter, ReflectMetadataProvider } from '@mikro-orm/core';
import { type MikroORMOptions } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/postgresql';
import { type Options } from '@mikro-orm/postgresql';
import { HttpException } from '@nestjs/common';

export function createMikroOrmConfig(opts: Partial<Options>) {
  return defineConfig({
    ...getDefaultMikroOrmOptions(),
    ...opts,
  });
}

export function getDefaultMikroOrmOptions() {
  return {
    forceUndefined: true,
    clientUrl: process.env.DB_DSN,
    debug: Boolean(process.env.DB_DEBUG),
    discovery: {
      disableDynamicFileAccess: true,
      requireEntitiesArray: true,
    },
    metadataProvider: ReflectMetadataProvider,
    resultCache: {
      adapter: MemoryCacheAdapter,
      expiration: 5000, // 5s
      options: {},
    },
    findOneOrFailHandler(entityName, where) {
      throw new HttpException(`未找到数据: ${entityName} ${inspect(where)}`, 404);
    },
    findExactlyOneOrFailHandler(entityName, where) {
      throw new HttpException(`错误的数据数量: ${entityName} ${inspect(where)}`, 400);
    },
    entities: [],
  } satisfies Partial<MikroORMOptions>;
}
