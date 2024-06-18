import { Constructor } from '@wener/utils';
import { Field, InputType, ObjectType } from 'type-graphql';

export function withNotesType<TBase extends Constructor>(Base: TBase) {
  @InputType()
  @ObjectType()
  class HasNotesMixinType extends Base {
    @Field(() => String, { nullable: true })
    notes?: string;
  }

  return HasNotesMixinType;
}
