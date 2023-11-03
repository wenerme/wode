import 'reflect-metadata';
import { MemoryCacheAdapter, ReflectMetadataProvider } from '@mikro-orm/core';
import { type MikroORMOptions } from '@mikro-orm/core/utils/Configuration';
import { defineConfig } from '@mikro-orm/postgresql';
import { type PostgreSqlOptions } from '@mikro-orm/postgresql/PostgreSqlMikroORM';
import { HttpException } from '@nestjs/common';
import { inspect } from 'util';

export function createMikroOrmConfig(opts: Partial<PostgreSqlOptions>) {
  return defineConfig({
    discovery: {
      disableDynamicFileAccess: true,
      requireEntitiesArray: true,
    },
    // clientUrl: process.env.DATABASE_DSN,
    // debug: NODE_ENV === 'development',
    // debug: true,
    metadataProvider: ReflectMetadataProvider,
    resultCache: {
      adapter: MemoryCacheAdapter,
      expiration: 5000, // 5s
      options: {},
    },
    findOneOrFailHandler: (entityName, where) => {
      throw new HttpException(`未找到数据: ${entityName} ${inspect(where)}`, 404);
    },
    findExactlyOneOrFailHandler: (entityName, where) => {
      throw new HttpException(`错误的数据数量: ${entityName} ${inspect(where)}`, 400);
    },
    ...opts,
  });
}

export function getDefaultMikroOrmOptions() {
  return {
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
    findOneOrFailHandler: (entityName, where) => {
      throw new HttpException(`未找到数据: ${entityName} ${inspect(where)}`, 404);
    },
    findExactlyOneOrFailHandler: (entityName, where) => {
      throw new HttpException(`错误的数据数量: ${entityName} ${inspect(where)}`, 400);
    },
  } satisfies Partial<MikroORMOptions>;
}
