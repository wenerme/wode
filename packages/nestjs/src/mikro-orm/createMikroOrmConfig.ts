import 'reflect-metadata';
import process from 'node:process';
import { inspect } from 'node:util';
import { MemoryCacheAdapter, ReflectMetadataProvider } from '@mikro-orm/core';
import { type MikroORMOptions } from '@mikro-orm/core';
import { type Options, defineConfig } from '@mikro-orm/postgresql';
import { HttpException } from '@nestjs/common';

export function createMikroOrmConfig(opts: Partial<Options>) {
  return defineConfig({
    ...getDefaultMikroOrmOptions(),
    ...opts,
  });
}

export function getDefaultMikroOrmOptions() {
  return {
    forceUndefined: true, // null -> undefined - 减少序列化后的内容
    clientUrl: process.env.DB_DSN,
    debug: Boolean(process.env.DB_DEBUG),
    discovery: {
      disableDynamicFileAccess: true, // 不要扫描文件
      requireEntitiesArray: true,
    },
    serialization: {
      forceObject: true, // 未 load 的对象，序列化为 `{id:'123'}` 而不是 `123`
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
