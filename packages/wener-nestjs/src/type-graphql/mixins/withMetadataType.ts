import type { Constructor } from '@wener/utils';
import { Field, InputType, InterfaceType, ObjectType } from 'type-graphql';
import { GraphQLJSONScalar } from '../GraphQLJSONScalar';
import { HasMetadataNode } from '../interface';

export function withMetadataType<TBase extends Constructor>(Base: TBase) {
  @InterfaceType({ implements: HasMetadataNode })
  @ObjectType({ implements: HasMetadataNode })
  @InputType()
  class HasMetadataMixinType extends Base {
    @Field(() => GraphQLJSONScalar, { nullable: true })
    metadata?: any;
  }

  return HasMetadataMixinType;
}
