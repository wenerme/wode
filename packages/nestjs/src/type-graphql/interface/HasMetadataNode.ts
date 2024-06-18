import { Field, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { GraphQLJSONScalar } from '../GraphQLJSONScalar';
import { RelayNode } from '../relay';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasMetadataNode.resolveType(...args);
  },
})
export class HasMetadataNode extends BaseNode {
  @Field(() => GraphQLJSONScalar, { nullable: true })
  metadata?: any;

  static resolveType = RelayNode.resolveType;
}
