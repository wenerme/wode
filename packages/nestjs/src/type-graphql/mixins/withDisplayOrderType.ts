import type { Constructor } from '@wener/utils';
import { Field, InputType, InterfaceType, ObjectType } from 'type-graphql';
import { HasDisplayOrderNode } from '../interface';

export function withDisplayOrderType<TBase extends Constructor>(Base: TBase) {
  @InterfaceType({ implements: HasDisplayOrderNode })
  @ObjectType({ implements: HasDisplayOrderNode })
  @InputType()
  class HasDisplayOrderMixinType extends Base {
    @Field(() => Number)
    displayOrder!: number;
  }

  return HasDisplayOrderMixinType;
}
