import { Field, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { RelayNode } from '../relay';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasNotesNode.resolveType(...args);
  },
})
export class HasNotesNode extends BaseNode {
  @Field(() => String, { nullable: true })
  notes?: string;

  static resolveType = RelayNode.resolveType;
}
