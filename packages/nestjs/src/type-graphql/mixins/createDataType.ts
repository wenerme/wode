import { Constructor } from '@wener/utils';
import { Field, InputType, ObjectType } from 'type-graphql';

export function createDataType<T extends object>(Type: Constructor<T>) {
  return function withDataType<TBase extends Constructor>(Base: TBase) {
    @InputType()
    @ObjectType()
    class HasDataMixinObject extends Base {
      @Field(() => Type)
      data!: T;
    }

    return HasDataMixinObject;
  };
}
