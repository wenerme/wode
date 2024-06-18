import { Field, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { RelayNode } from '../relay';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasMetadataNode.resolveType(...args);
  },
})
export class HasMetadataNode extends BaseNode {
  @Field(() => Object, { nullable: true })
  metadata?: any;

  static resolveType = RelayNode.resolveType;
}
