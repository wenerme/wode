import { Constructor } from '@wener/utils';
import { Field, InputType, ObjectType } from 'type-graphql';
import { HasTagsNode } from '../interface';

export function withTagsObject<TBase extends Constructor>(Base: TBase) {
  @ObjectType({ implements: HasTagsNode })
  @InputType()
  class HasTagsMixinObject extends Base {
    @Field(() => [String], { defaultValue: [], nullable: true })
    tags: string[] = [];
  }

  return HasTagsMixinObject;
}
