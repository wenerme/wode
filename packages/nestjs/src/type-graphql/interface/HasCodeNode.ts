import { Field, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { RelayNode } from '../relay';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasCodeNode.resolveType(...args);
  },
})
export class HasCodeNode extends BaseNode {
  @Field(() => String, { nullable: true })
  code?: any;

  static resolveType = RelayNode.resolveType;
}
