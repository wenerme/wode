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
  @Field(() => [String], { defaultValue: [], nullable: true })
  tags: string[] = [];

  static resolveType = RelayNode.resolveType;
}
