import { Constructor } from '@wener/utils';
import { Field, InputType, InterfaceType, ObjectType } from 'type-graphql';
import { HasTagsNode } from '../interface';
import { EmptyArray } from './const';

export function withTagsType<TBase extends Constructor>(Base: TBase) {
  @InterfaceType({ implements: HasTagsNode })
  @ObjectType({ implements: HasTagsNode })
  @InputType()
  class HasTagsMixinType extends Base {
    @Field(() => [String], { defaultValue: EmptyArray, nullable: true })
    tags: string[] = EmptyArray;
  }

  return HasTagsMixinType;
}
