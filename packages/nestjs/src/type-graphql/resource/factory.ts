import { computeIfAbsent, type Constructor } from '@wener/utils';
import { Field, InputType, ObjectType } from 'type-graphql';
import { getTypeCache } from '../getTypeCache';
import { BaseCreateResourceInput } from './BaseCreateResourceInput';
import { BaseUpdateResourceInput } from './BaseUpdateResourceInput';

export interface CreateResourceInput<T> extends BaseCreateResourceInput {
  data: T;
}

export interface UpdateResourceInput<T> extends BaseUpdateResourceInput {
  data: T;
}

export function createCreateResourceInput<T extends object>(Type: Constructor<T>): Constructor<CreateResourceInput<T>> {
  // ResourceCreateInput
  let name = Type.name.replace(/(Update|Creare)?Input$/, '');

  // CreateResourceInput
  let key = `Create${name}Input`;
  return computeIfAbsent(getTypeCache(), key, () => {
    @InputType(key)
    class CreateInput extends BaseCreateResourceInput {
      @Field((type) => Type)
      data!: T;
    }

    return CreateInput;
  });
}

export function createUpdateResourceInput<T extends object>(Type: Constructor<T>): Constructor<CreateResourceInput<T>> {
  // ResourceCreateInput
  let name = Type.name.replace(/(Update|Creare)?Input$/, '');
  // CreateResourceInput
  let key = `Update${name}Input`;
  return computeIfAbsent(getTypeCache(), key, () => {
    @InputType(key)
    class UpdateInput extends BaseUpdateResourceInput {
      @Field((type) => Type)
      data!: T;
    }

    return UpdateInput;
  });
}
