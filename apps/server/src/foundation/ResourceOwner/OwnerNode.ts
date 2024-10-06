import { BaseNode, RelayNode } from '@wener/nestjs/type-graphql';
import { InterfaceType } from 'type-graphql';

@InterfaceType('OwnerNode', {
  autoRegisterImplementations: false,
  implements: [BaseNode],
  resolveType: (...args) => {
    return RelayNode.resolveType(...args);
  },
})
export class OwnerNode extends BaseNode {}
