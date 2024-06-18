import { Constructor } from '@wener/utils';
import { Field, InputType, ObjectType } from 'type-graphql';
import { HasDisplayOrderNode } from '../interface';

export function withDisplayOrderObject<TBase extends Constructor>(Base: TBase) {
  @ObjectType({ implements: HasDisplayOrderNode })
  @InputType()
  class HasDisplayOrderMixinObject extends Base {
    @Field(() => Number)
    displayOrder!: number;
  }

  return HasDisplayOrderMixinObject;
}
