import { Field, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { RelayNode } from '../relay';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasTitleDescriptionNode.resolveType(...args);
  },
})
export class HasTitleDescriptionNode extends BaseNode {
  static resolveType = RelayNode.resolveType;
  @Field(() => String, { nullable: false })
  title!: string;

  @Field(() => String, { nullable: true })
  description?: string;
}
