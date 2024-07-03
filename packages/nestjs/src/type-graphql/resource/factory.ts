import { computeIfAbsent, type Constructor } from '@wener/utils';
import { Field, InputType, ObjectType } from 'type-graphql';
import { getObjectName } from '../getObjectName';
import { getTypeCache } from '../getTypeCache';
import { RelayMutationInput, RelayMutationPayload } from '../relay';
import { BaseCreateResourceInput, BaseUpdateResourceInput } from './types';

export interface CreateResourceInput<T> extends BaseCreateResourceInput {
  data: T;
}

export interface UpdateResourceInput<T> extends BaseUpdateResourceInput {
  data: T;
}

export interface MutationResourcePayload<T> extends RelayMutationInput {
  data: T;
  clientMutationId?: string;
}

export function createCreateResourceInput<T extends object>(Type: Constructor<T>): Constructor<CreateResourceInput<T>> {
  // ResourceCreateInput
  let name = Type.name.replace(/(Update|Creare)?Input$/, '');

  // CreateResourceInput
  let key = `Create${name}Input`;
  return computeIfAbsent(getTypeCache(), key, () => {
    @InputType(key)
    class CreateResourceInput extends BaseCreateResourceInput {
      @Field((type) => Type)
      data!: T;
    }

    return CreateResourceInput;
  });
}

export function createUpdateResourceInput<T extends object>(Type: Constructor<T>): Constructor<UpdateResourceInput<T>> {
  // ResourceCreateInput
  let name = Type.name.replace(/(Update|Creare)?Input$/, '');
  // CreateResourceInput
  let key = `Update${name}Input`;
  return computeIfAbsent(getTypeCache(), key, () => {
    @InputType(key)
    class UpdateResourceInput extends BaseUpdateResourceInput {
      @Field((type) => Type)
      data!: T;
    }

    return UpdateResourceInput;
  });
}

export function createMutationResourcePayload<T extends object>(
  Type: Constructor<T>,
): Constructor<MutationResourcePayload<T>> {
  let name = getObjectName(Type);
  let key = `Mutation${name}Payload`;
  return computeIfAbsent(getTypeCache(), key, () => {
    @ObjectType(key)
    class MutationResourcePayload extends RelayMutationPayload {
      @Field((type) => Type)
      data!: T;
    }

    return MutationResourcePayload;
  });
}

export function createUpdateResourcePayload<T extends object>(
  Type: Constructor<T>,
): Constructor<MutationResourcePayload<T>> {
  let name = getObjectName(Type);
  let key = `Update${name}Payload`;
  return computeIfAbsent(getTypeCache(), key, () => {
    @ObjectType(key)
    class UpdateResourcePayload extends RelayMutationPayload {
      @Field((type) => Type)
      data!: T;
    }

    return UpdateResourcePayload;
  });
}

export function createCreateResourcePayload<T extends object>(
  Type: Constructor<T>,
): Constructor<MutationResourcePayload<T>> {
  let name = getObjectName(Type);
  let key = `Create${name}Payload`;
  return computeIfAbsent(getTypeCache(), key, () => {
    @ObjectType(key)
    class CreateResourcePayload extends RelayMutationPayload {
      @Field((type) => Type)
      data!: T;
    }

    return CreateResourcePayload;
  });
}
