import type { Constructor } from '@wener/utils';
import { Field, InputType, InterfaceType, ObjectType } from 'type-graphql';
import { HasTagsNode } from '../interface';

export function withTagsType<TBase extends Constructor>(Base: TBase) {
  @InterfaceType({ implements: HasTagsNode })
  @ObjectType({ implements: HasTagsNode })
  @InputType()
  class HasTagsMixinType extends Base {
    @Field(() => [String], { nullable: true })
    tags?: string[];
  }

  return HasTagsMixinType;
}
