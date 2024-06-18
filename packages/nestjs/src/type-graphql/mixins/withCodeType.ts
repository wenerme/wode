import { Constructor } from '@wener/utils';
import { Field, InputType, InterfaceType, ObjectType } from 'type-graphql';
import { HasCodeNode, HasNotesNode } from '../interface';

export function withCodeType<TBase extends Constructor>(Base: TBase) {
  @InterfaceType({ implements: HasCodeNode })
  @ObjectType({ implements: HasCodeNode })
  @InputType()
  class HasCodeMixinType extends Base {
    @Field(() => String, { nullable: true })
    code?: string;
  }

  return HasCodeMixinType;
}
