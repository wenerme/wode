import { Constructor } from '@wener/utils';
import { Field, InputType, ObjectType } from 'type-graphql';

export function withNotesObject<TBase extends Constructor>(Base: TBase) {
  @InputType()
  @ObjectType()
  class HasNotesMixinObject extends Base {
    @Field(() => String, { nullable: true })
    notes?: string;
  }

  return HasNotesMixinObject;
}
