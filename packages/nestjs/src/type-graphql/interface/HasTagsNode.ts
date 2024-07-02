import { Field, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { RelayNode } from '../relay';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasTagsNode.resolveType(...args);
  },
})
export class HasTagsNode extends BaseNode {
  static resolveType = RelayNode.resolveType;
  @Field(() => [String], { nullable: true })
  tags?: string[];
}
