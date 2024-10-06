import { Inject, Injectable } from '@nestjs/common';
import { getContext } from '@wener/nestjs';
import type { TenantBaseEntity } from '@wener/nestjs/entity';
import { RelayMutationPayload, RelayNode, runRelayClientMutation } from '@wener/nestjs/type-graphql';
import { HasOwnerRefNode, HasStateStatusNode } from '@wener/nestjs/type-graphql/interface';
import {
  MutationNodePayload,
  MutationResourceInput,
  ResolveResourceQueryInput,
} from '@wener/nestjs/type-graphql/resource';
import { Errors, type Constructor } from '@wener/utils';
import {
  Arg,
  Authorized,
  Field,
  FieldResolver,
  ID,
  InputType,
  InterfaceType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  Subscription,
} from 'type-graphql';
import { CustomAutoEntityService } from '@/foundation/services/CustomAutoEntityService';
import { requireTenantId } from '@/foundation/Tenant';
import { UserObject } from '@/foundation/User/graph/UserResolver';
import { HasCustomerNode } from '@/graph/HasCustomerNode';
import { ResourceNode } from '@/graph/ResourceNode';
import { getRemoteEvents } from '@/server/events';
import { loadEntity } from '@/utils/orm/loadEntity';

@InterfaceType({
  implements: [ResourceNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasUserNode.resolveType(...args);
  },
})
export class HasUserNode extends ResourceNode {
  @Field(() => ID, { nullable: true })
  userId?: string;

  static resolveType = RelayNode.resolveType;
}

export function withUserType<TBase extends Constructor>(Base: TBase) {
  @InterfaceType({ implements: HasUserNode })
  @ObjectType({ implements: HasUserNode })
  @InputType()
  class HasUserMixinType extends Base {
    @Field(() => ID, { nullable: true })
    userId?: string;
  }

  return HasUserMixinType;
}

@InputType({ description: '为资源分配负责人' })
export class AssignOwnerInput extends MutationResourceInput {
  @Field(() => String)
  ownerId!: string;
  @Field(() => String, { nullable: true })
  ownerType?: string;
}

@InputType({ description: '释放资源负责人' })
export class ReleaseOwnerInput extends MutationResourceInput {}

@InputType({ description: '认领资源' })
export class ClaimOwnerInput extends MutationResourceInput {}

@ObjectType()
export class NodePayload extends RelayMutationPayload {
  @Field(() => RelayNode)
  data!: RelayNode;
}

@ObjectType()
export class HasOwnerNodePayload extends RelayMutationPayload {
  @Field(() => HasOwnerRefNode)
  data!: HasOwnerRefNode;
}

@ObjectType()
export class HasCustomerNodePayload extends RelayMutationPayload {
  @Field(() => HasCustomerNode)
  data!: HasCustomerNode;
}

@ObjectType()
export class HasUserNodePayload extends RelayMutationPayload {
  @Field(() => HasUserNode)
  data!: HasUserNode;
}

// import {ResolveResourceQueryInput} from '@wener/nestjs/type-graphql'

@ObjectType()
export class DeleteResourcePayload extends RelayMutationPayload {
  @Field(() => RelayNode, { nullable: true })
  data?: RelayNode;
}

@InputType()
class SetResourceStatusInput extends MutationResourceInput {
  @Field(() => String)
  status!: string;

  @Field(() => String, { nullable: true })
  comment?: string;
}

@InputType()
class SetResourceNotesInput extends MutationResourceInput {
  @Field(() => String)
  notes!: string;
}

@ObjectType()
class SetResourceStatusPayload extends RelayMutationPayload {
  @Field(() => HasStateStatusNode)
  data!: HasStateStatusNode;
}

@InputType({
  description: '为资源绑定实体/entityId',
})
class BindEntityInput extends MutationResourceInput {
  @Field(() => ID)
  entityId!: string;
}

@InputType()
class UnbindEntityInput extends MutationResourceInput {
  @Field(() => ID, { nullable: true })
  entityId?: string;
}

@InputType({
  description: '为实体绑定用户',
})
class BindUserInput extends MutationResourceInput {
  @Field(() => ID)
  userId!: string;
}

@InputType()
class UnbindUserInput extends MutationResourceInput {
  @Field(() => ID, { nullable: true })
  userId?: string;
}

@InputType()
class DeleteResourceInput extends MutationResourceInput {}

@InputType({
  description: '为实体绑定用户',
})
class BindCustomerInput extends MutationResourceInput {
  @Field(() => ID)
  customerId!: string;
}

@InputType()
class UnbindCustomerInput extends MutationResourceInput {}

@InputType()
class WatchResourceInput {
  @Field(() => ID)
  id!: string;
}

@Resolver()
@Injectable()
export class EntityResolver {
  constructor(@Inject(CustomAutoEntityService) private readonly svc: CustomAutoEntityService) {}

  @Authorized()
  @Mutation(() => HasOwnerNodePayload)
  bindEntity(@Arg('input', () => BindEntityInput) input: BindEntityInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.bindEntity(input, input);
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Mutation(() => HasOwnerNodePayload)
  unbindEntity(@Arg('input', () => UnbindEntityInput) input: UnbindEntityInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.unbindEntity(input);
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Mutation(() => HasUserNodePayload)
  bindUser(@Arg('input', () => BindUserInput) input: BindUserInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.bindUser(input, input);
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Mutation(() => HasUserNodePayload)
  unbindUser(@Arg('input', () => UnbindUserInput) input: UnbindUserInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.unbindUser(input, input);
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Mutation(() => HasCustomerNodePayload)
  bindCustomer(@Arg('input', () => BindCustomerInput) input: BindCustomerInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.bindCustomer(input, input);
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Mutation(() => HasCustomerNodePayload)
  unbindCustomer(@Arg('input', () => UnbindCustomerInput) input: BindCustomerInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.unbindCustomer(input, input);
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Mutation(() => HasOwnerNodePayload)
  assignOwner(@Arg('input', () => AssignOwnerInput) input: AssignOwnerInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.assignEntityOwner(input, input);
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Mutation(() => HasOwnerNodePayload)
  releaseOwner(@Arg('input', () => ReleaseOwnerInput) input: ReleaseOwnerInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.releaseEntityOwner(input, {});
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Mutation(() => HasOwnerNodePayload)
  claimOwner(@Arg('input', () => ClaimOwnerInput) input: ClaimOwnerInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.claimEntityOwner(input, {});
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Mutation(() => DeleteResourcePayload)
  deleteResource(@Arg('input', () => DeleteResourceInput) input: DeleteResourceInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.deleteEntity(input);
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Mutation(() => RelayMutationPayload)
  undeleteResource(@Arg('input', () => DeleteResourceInput) input: DeleteResourceInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.undeleteEntity(input);
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Mutation(() => DeleteResourcePayload)
  purgeResource(@Arg('input', () => DeleteResourceInput) input: DeleteResourceInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.purgeEntity(input);
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Query(() => RelayNode, { nullable: true })
  async resolveResource(@Arg('query', () => ResolveResourceQueryInput) input: ResolveResourceQueryInput) {
    const { entity } = await this.svc.resolveEntity(input);
    return entity;
  }

  @Authorized()
  @Mutation(() => SetResourceStatusPayload)
  setResourceStatus(@Arg('input', () => SetResourceStatusInput) input: SetResourceStatusInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.setEntityStatus(input, input);
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Mutation(() => MutationNodePayload)
  setResourceNotes(@Arg('input', () => SetResourceNotesInput) input: SetResourceNotesInput) {
    return runRelayClientMutation(input, async () => {
      const { entity } = await this.svc.setEntityNotes(input, input);
      return {
        data: entity,
      };
    });
  }

  @Authorized()
  @Subscription(() => RelayNode, {
    subscribe: async function* ({ args: { id } }) {
      const tid = requireTenantId();
      let svc = getContext(CustomAutoEntityService);
      const { entity } = await svc.requireEntity<TenantBaseEntity>({ id });

      Errors.BadRequest.check(entity.tid !== tid, `Invalid id`);

      yield entity;

      for await (let event of getRemoteEvents().events('entity:change')) {
        if (event.entity.id !== id) {
          continue;
        }
        await svc.em.refresh(entity);
        yield entity;
      }
    },
  })
  watchResource(@Arg('input', () => WatchResourceInput) input: WatchResourceInput, @Root() data: RelayNode) {
    return data;
  }
}

@Resolver(() => HasUserNode)
export class HasUserResolver {
  @Authorized()
  @FieldResolver(() => UserObject, { nullable: true })
  async user(@Root() entity: any) {
    return loadEntity(entity.user);
  }
}
