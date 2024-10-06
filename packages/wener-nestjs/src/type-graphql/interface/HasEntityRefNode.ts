import { Field, ID, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { RelayNode } from '../relay';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasEntityRefNode.resolveType(...args);
  },
})
export class HasEntityRefNode extends BaseNode {
  @Field(() => ID, { nullable: true })
  entityId?: string;
  @Field(() => String, { nullable: true })
  entityType?: string;

  static resolveType = RelayNode.resolveType;
}
