import { Field, InterfaceType } from 'type-graphql';
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

  @Field(() => String, { nullable: true })
  createdById?: string;
  @Field(() => String, { nullable: true })
  updatedById?: string;
  @Field(() => String, { nullable: true })
  deletedById?: string;
}
