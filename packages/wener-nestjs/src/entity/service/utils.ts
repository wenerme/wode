import type { Collection, FilterQuery } from '@mikro-orm/core';
import type { StandardBaseEntity } from '../StandardBaseEntity';
import type { ResolvedEntityContext } from './resolveEntityContext';

interface LoadTypeOptions<E extends StandardBaseEntity> extends ResolvedEntityContext<E> {}

export function loadType<E extends StandardBaseEntity>(opts: LoadTypeOptions<E>) {}

interface FindCollectionOptions<E extends StandardBaseEntity> extends ResolvedEntityContext<E> {
  refresh?: boolean;
  where?: FilterQuery<E>;
}

export function findCollection<E extends StandardBaseEntity>(col: Collection<E>, opts: FindCollectionOptions<E>) {
  const where: FilterQuery<E>[] = [];
  if (!where) {
    return col.loadItems();
  }
  return col.matching({
    where,
  });
}
