import 'reflect-metadata';
import process from 'node:process';
import { inspect } from 'node:util';
import { MemoryCacheAdapter, ReflectMetadataProvider, type MikroORMOptions } from '@mikro-orm/core';
import { defineConfig, type Options } from '@mikro-orm/postgresql';
import { HttpException } from '@nestjs/common';
import { parseBoolean } from '@wener/utils';

export function defineMikroOrmOptions(opts: Partial<Options>) {
  return defineConfig({
    ...getDefaultMikroOrmOptions(),
    ...opts,
  });
}

export function getDefaultMikroOrmOptions({
  env = process.env,
}: {
  readonly env?: Record<string, string | undefined>;
} = {}) {
  const { DATABASE_DSN, DB_URL, DATABASE_URL, DB_DSN, DB_DEBUG, DATABASE_DEBUG } = env;
  const clientUrl = DB_DSN || DATABASE_DSN || DB_URL || DATABASE_URL;
  const debug = parseBoolean(DB_DEBUG || DATABASE_DEBUG);
  return {
    forceUndefined: true, // null -> undefined - 减少序列化后的内容
    clientUrl,
    debug,
    discovery: {
      disableDynamicFileAccess: true, // 不要扫描文件
      requireEntitiesArray: true,
    },
    serialization: {
      forceObject: true, // 未 load 的对象，序列化为 `{id:'123'}` 而不是 `123`, 统一对象格式
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
