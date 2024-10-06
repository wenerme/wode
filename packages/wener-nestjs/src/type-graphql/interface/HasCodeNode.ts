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
  static resolveType = RelayNode.resolveType;

  @Field(() => String, { nullable: true })
  code?: any;
}
