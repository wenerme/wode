import { Field, InterfaceType } from 'type-graphql';
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
  @Field(() => String, { nullable: true })
  ownerId?: string;
  @Field(() => String, { nullable: true })
  ownerType?: string;
  @Field(() => String, { nullable: true })
  ownerUserId?: string;

  static resolveType = RelayNode.resolveType;
}
