import { Field, ID, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { RelayNode } from '../relay';

export { HasTagsNode } from './HasTagsNode';
export { HasDisplayOrderNode } from './HasDisplayOrderNode';
export { HasNotesNode } from './HasNotesNode';
export { HasMetadataNode } from './HasMetadataNode';
export { HasCodeNode } from './HasCodeNode';
export { HasOwnerRefNode } from './HasOwnerRefNode';
export { HasAuditorRefNode } from './HasAuditorRefNode';
export { HasStateStatusNode } from './HasStateStatusNode';

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasVendorRefNode.resolveType(...args);
  },
})
export class HasVendorRefNode extends BaseNode {
  @Field(() => String, { nullable: true })
  cid?: string;

  @Field(() => String, { nullable: true })
  rid?: string;

  static resolveType = RelayNode.resolveType;
}

@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasCustomerRefNode.resolveType(...args);
  },
})
export class HasCustomerRefNode extends BaseNode {
  @Field(() => ID, { nullable: true })
  customerId?: string;
  @Field(() => String, { nullable: true })
  customerType?: string;
  @Field(() => ID, { nullable: true })
  contactId?: string;
  @Field(() => ID, { nullable: true })
  accountId?: string;

  static resolveType = RelayNode.resolveType;
}
