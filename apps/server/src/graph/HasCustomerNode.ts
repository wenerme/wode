import { BaseNode, RelayNode } from '@wener/nestjs/type-graphql';
import { Field, InterfaceType } from 'type-graphql';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return RelayNode.resolveType(...args);
  },
})
export class HasCustomerNode extends BaseNode {
  @Field(() => String, { nullable: true })
  customerId?: string;
  @Field(() => String, { nullable: true })
  customerType?: string;
  @Field(() => String, { nullable: true })
  contactId?: string;
  @Field(() => String, { nullable: true })
  accountId?: string;
}
