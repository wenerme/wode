import { Field, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { RelayNode } from '../relay';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasStateStatusNode.resolveType(...args);
  },
})
export class HasStateStatusNode extends BaseNode {
  static resolveType = RelayNode.resolveType;

  @Field(() => String)
  state!: string;
  @Field(() => String)
  status!: string;
}
