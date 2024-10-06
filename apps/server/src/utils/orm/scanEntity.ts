import type { EntityRepository } from '@mikro-orm/postgresql';
import { toMikroOrmQuery } from '@wener/miniquery/mikro-orm';
import { arrayOfMaybeArray, type MaybeArray } from '@wener/utils';

export async function* scanEntity<E extends { id: string }>({
  cursor,
  after = cursor || '',
  before,
  where,
  repo,
  batch = 10,
  onCount,
}: {
  cursor?: string;
  before?: string;
  after?: string;
  where?: Record<string, any>;
  repo: EntityRepository<E>;
  batch?: number;
  onCount?: (count: number) => void;
}) {
  const _where = () => {
    return buildScanQueryFilter({
      after,
      before,
      where,
    });
  };
  if (onCount) {
    onCount(await repo.count(_where()));
  }
  while (true) {
    let items: E[] = await repo.findAll({
      // cache some ?
      where: _where(),
      limit: batch,
      orderBy: {
        id: 1,
      } as any,
    });

    for (let item of items) {
      yield item;
    }

    after = items.at(-1)?.id || '';
    if (!items.length) {
      break;
    }
  }
}

export interface ScanFilterOptions {
  cursor?: string;
  after?: string;
  before?: string;
  where?: MaybeArray<Record<string, any>>;
  filer?: string;
  filers?: string[];
}

function buildScanQueryFilter({ cursor, after = cursor || '', before, where, filers = [], filer }: ScanFilterOptions) {
  return {
    $and: [
      after
        ? {
            id: {
              $gt: after,
            },
          }
        : {},
      before
        ? {
            id: {
              $lt: before,
            },
          }
        : {},
      ...arrayOfMaybeArray(where),
      ...[filer, ...filers].filter(Boolean).flatMap((v) => toMikroOrmQuery(v)),
    ],
  };
}
