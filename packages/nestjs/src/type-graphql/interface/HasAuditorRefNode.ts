import { Field, ID, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { RelayNode } from '../relay';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasAuditorRefNode.resolveType(...args);
  },
})
export class HasAuditorRefNode extends BaseNode {
  static resolveType = RelayNode.resolveType;

  @Field(() => ID, { nullable: true })
  createdById?: string;
  @Field(() => ID, { nullable: true })
  updatedById?: string;
  @Field(() => ID, { nullable: true })
  deletedById?: string;
}
