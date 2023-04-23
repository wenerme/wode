import dayjs from 'dayjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { HttpException } from '@nestjs/common';
import { ms } from '@wener/utils';
import { type HttpRequestLog } from './HttpRequestLog';

export interface FindCacheOptions {
  expires?: string;
  url: string;
  method: string;
  cookie?: string;
  requestPayload?: Record<string, any>;
  schema?: string;
}

export class HttpRequestLogRepository extends EntityRepository<HttpRequestLog> {
  findCache({ expires, url, method, cookie, requestPayload, schema }: FindCacheOptions) {
    const qb = this.qb();
    let createdAt: Date | undefined;
    if (expires) {
      createdAt = new Date(Date.now() - ms(expires as `1`));
      if (!dayjs(createdAt).isValid()) {
        createdAt = undefined;
        throw new HttpException(`invalid expires: ${expires}`, 400);
      }
    }

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
}
