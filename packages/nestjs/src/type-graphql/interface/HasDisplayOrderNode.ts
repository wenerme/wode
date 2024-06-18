import { Field, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { RelayNode } from '../relay';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasDisplayOrderNode.resolveType(...args);
  },
})
export class HasDisplayOrderNode extends BaseNode {
  static resolveType = RelayNode.resolveType;

  @Field(() => Number)
  displayOrder!: number;
}
