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
  @Field(() => Number)
  displayOrder!: number;

  static resolveType = RelayNode.resolveType;
}
