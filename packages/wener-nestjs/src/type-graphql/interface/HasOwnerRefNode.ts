import { Field, ID, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { RelayNode } from '../relay';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasOwnerRefNode.resolveType(...args);
  },
})
export class HasOwnerRefNode extends BaseNode {
  @Field(() => ID, { nullable: true })
  ownerId?: string;
  @Field(() => String, { nullable: true })
  ownerType?: string;
  @Field(() => ID, { nullable: true })
  ownerUserId?: string;

  static resolveType = RelayNode.resolveType;
}
