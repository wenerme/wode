import { EntityRepository } from '@mikro-orm/postgresql';
import { HttpException } from '@nestjs/common';
import { toMikroOrmQuery } from '@wener/miniquery/mikro-orm';
import { ms } from '@wener/utils';
import dayjs from 'dayjs';
import { BaseHttpRequestLogEntity } from './BaseHttpRequestLogEntity';

export interface FindCacheOptions {
  expires?: string;
  url: string;
  method: string;
  cookie?: string;
  requestPayload?: Record<string, any>;
  schema?: string;
  filter?: string;
}
export function findHttpRequestCache<T extends BaseHttpRequestLogEntity>(
  repo: EntityRepository<T>,
  opts: FindCacheOptions,
) {
  const { expires, url, method, cookie, requestPayload, schema } = opts;
  const qb = repo.qb();
  let createdAt: Date | undefined;
  if (expires) {
    createdAt = new Date(Date.now() - ms(expires as `1`));
    if (!dayjs(createdAt).isValid()) {
      createdAt = undefined;
      throw new HttpException(`invalid expires: ${expires}`, 400);
    }
  }

  //
  qb.andWhere(toMikroOrmQuery(opts.filter));

  qb.where({
    url,
    method,
    ok: true,
  })
    .orderBy({ createdAt: 'DESC' })
    .limit(1);
  if (schema) {
    qb.withSchema(schema);
  }
  if (cookie) {
    qb.andWhere({ requestHeaders: { cookie } });
  }
  if (createdAt) {
    qb.andWhere({ createdAt: { $gte: createdAt } });
  }
  if (requestPayload) {
    // 直接用 orm 匹配有问题
    qb.andWhere(`request_payload @> ?::jsonb`, [JSON.stringify(requestPayload)]);
    // strict
    qb.andWhere(`request_payload <@ ?::jsonb`, [JSON.stringify(requestPayload)]);
  }
  return qb.getSingleResult();
}
