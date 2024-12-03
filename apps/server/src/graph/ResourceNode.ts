import { BaseNode, RelayNode } from '@wener/nestjs/type-graphql';
import { HasOwnerRefNode, HasStateStatusNode } from '@wener/nestjs/type-graphql/interface';
import { withOwnerRefType, withStateStatusType } from '@wener/nestjs/type-graphql/mixins';
import { mixin } from '@wener/utils';
import { Field, ID, InterfaceType, ObjectType } from 'type-graphql';
import { OwnerNode } from '@/foundation/ResourceOwner/OwnerNode';
import { UserObject } from '@/foundation/User/graph/UserResolver';
import { TenantBaseObject } from '@/graph/TenantBaseObject';

@ObjectType({
  implements: [BaseNode, RelayNode, HasOwnerRefNode, HasStateStatusNode],
})
@InterfaceType({
  autoRegisterImplementations: false,
  implements: [BaseNode, RelayNode, HasOwnerRefNode, HasStateStatusNode],
  resolveType: (...args) => {
    return RelayNode.resolveType(...args);
  },
})
export class ResourceNode extends mixin(TenantBaseObject, withStateStatusType, withOwnerRefType) {
  @Field(() => OwnerNode, { nullable: true })
  owner?: OwnerNode;

  @Field(() => ID, { nullable: true })
  createdById?: string;
  @Field(() => ID, { nullable: true })
  updatedById?: string;
  @Field(() => ID, { nullable: true })
  deletedById?: string;

  @Field(() => UserObject, { nullable: true })
  createdBy?: UserObject;
  @Field(() => UserObject, { nullable: true })
  updatedBy?: UserObject;
  @Field(() => UserObject, { nullable: true })
  deletedBy?: UserObject;
}

@ObjectType({
  implements: [ResourceNode],
})
export class ResourceObject extends ResourceNode {}
