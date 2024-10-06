import type { Constructor } from '@wener/utils';
import { Field, InputType, InterfaceType, ObjectType } from 'type-graphql';
import { HasNotesNode } from '../interface';

export function withNotesType<TBase extends Constructor>(Base: TBase) {
  @InterfaceType({ implements: HasNotesNode })
  @ObjectType({ implements: HasNotesNode })
  @InputType()
  class HasNotesMixinType extends Base {
    @Field(() => String, { nullable: true })
    notes?: string;
  }

  return HasNotesMixinType;
}
