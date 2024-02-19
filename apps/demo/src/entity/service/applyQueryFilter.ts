import type { QBFilterQuery } from '@mikro-orm/core';
import type { QueryBuilder } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { toMikroOrmQuery } from '@wener/miniquery/mikro-orm';
import { Errors } from '@wener/utils';

const log = new Logger(applyQueryFilter.name);

export function applyQueryFilter<T extends QueryBuilder<any>>({
  builder,
  query: { filter, filters = [] },
}: {
  builder: T;
  query: {
    filter?: string;
    filters?: string[];
  };
}) {
  for (let q of [filter, ...filters].map((v) => v?.trim()).filter(Boolean)) {
    try {
      builder.andWhere(toMikroOrmQuery(q) as QBFilterQuery);
    } catch (error: any) {
      log.error(`Invalid filter: $filter} ${error}`);

      throw Errors.BadRequest.asError({
        message: 'Invalid filter',
        description: error?.message as string,
      });
    }
  }
}
