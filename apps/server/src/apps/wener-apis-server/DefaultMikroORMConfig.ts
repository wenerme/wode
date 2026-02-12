import { inspect } from 'node:util';
import type { MikroORMOptions } from '@mikro-orm/core';
import { MemoryCacheAdapter } from '@mikro-orm/postgresql';
import { Errors } from '@wener/utils';

export const DefaultMikroORMConfig: Partial<MikroORMOptions<any, any>> = {
	resultCache: {
		adapter: MemoryCacheAdapter,
		expiration: 1000, // 1s
		global: 50,
		options: {},
	},
	serialization: {
		includePrimaryKeys: true,
		forceObject: true,
	},
	findOneOrFailHandler(entityName, where) {
		throw Errors.NotFound.asError(`未找到数据: ${entityName} ${inspect(where)}`);
	},
	findExactlyOneOrFailHandler(entityName, where) {
		throw Errors.BadRequest.asError(`错误的数据数量: ${entityName} ${inspect(where)}`);
	},
};
