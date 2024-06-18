import { computeIfAbsent, type AbstractConstructor, type Constructor } from '@wener/utils';
import { Field, Int, ObjectType } from 'type-graphql';
import { getObjectName } from './getObjectName';
import { getTypeCache } from './getTypeCache';
import { PageResponse } from './types';

export function createListPayload<T extends object>(Type: Constructor<T>): Constructor<PageResponse<T>> {
  let name = getObjectName(Type);
  let key = `${name}ListPayload`;
  return computeIfAbsent(getTypeCache(), key, () => {
    @ObjectType(key)
    class ListPayload {
      @Field((type) => Int)
      total!: number;
      @Field((type) => [Type])
      data!: T[];
    }

    return ListPayload;
  });
}
