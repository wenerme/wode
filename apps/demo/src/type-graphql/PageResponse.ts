import type { AbstractConstructor, Constructor } from '@wener/nestjs';
import { Field, Int, ObjectType } from 'type-graphql';
import { computeIfAbsent } from '@/type-graphql/computeIfAbsent';
import { getTypeCache } from '@/type-graphql/getTypeCache';
import { PageResponse } from '@/type-graphql/types';

export function PageResponseOf<T extends object>(
  Data: Constructor<T> | AbstractConstructor<T>,
): Constructor<PageResponse<T>> {
  let name = `Abstract${Data.name}PaginatedResponse`;
  return computeIfAbsent(getTypeCache(), name, () => {
    @ObjectType(name)
    class AbstractPageResponse<T> {
      @Field((type) => Int)
      total!: number;
      @Field((type) => [Data])
      data!: T[];
    }

    return AbstractPageResponse;
  });
}
