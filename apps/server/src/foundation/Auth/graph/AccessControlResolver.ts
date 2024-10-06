import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import type { StandardBaseEntity } from '@wener/nestjs/entity';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import {
  BaseObject,
  createBaseEntityResolver,
  createListPayload,
  RelayMutationInput,
  RelayMutationPayload,
  runRelayClientMutation,
  withBaseQuery,
} from '@wener/nestjs/type-graphql';
import { withStateStatusType } from '@wener/nestjs/type-graphql/mixins';
import { mixin } from '@wener/utils';
import type { GraphQLResolveInfo } from 'graphql/type';
import _ from 'lodash';
import {
  Arg,
  Authorized,
  Field,
  FieldResolver,
  Info,
  InputType,
  Mutation,
  ObjectType,
  Resolver,
  Root,
} from 'type-graphql';
import { AccessControlService } from '@/foundation/Auth/AccessControlService';
import { AuthPermissionService } from '@/foundation/Auth/AuthPermissionService';
import { AuthRoleService } from '@/foundation/Auth/AuthRoleService';
import { AuthEntityRoleEntity } from '@/foundation/Auth/entity/AuthEntityRoleEntity';
import { AuthPermissionEntity } from '@/foundation/Auth/entity/AuthPermissionEntity';
import { AuthRoleEntity } from '@/foundation/Auth/entity/AuthRoleEntity';
import { UserEntity } from '@/foundation/User/entity/UserEntity';
import { DeleteEntityInput, DeleteEntityPayload } from '@/graph/common';
import { SystemRole } from '@/graph/const';
import { HasRoleObject } from '@/graph/HasRoleObject';
import { createImportInput, createImportPayload } from '@/graph/ImportEntityResolver';

@ObjectType('AuthRole', { implements: [HasRoleObject] })
export class AuthRoleObject extends mixin(BaseObject, withStateStatusType) {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  code!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Boolean)
  systemManaged!: boolean;
}

@ObjectType('AuthPermission')
export class AuthPermissionObject extends BaseObject {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  code!: string;

  @Field(() => String, { nullable: true })
  description?: string;
}

@InputType()
export class AuthRoleInput {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  code!: string;

  @Field(() => String, { nullable: true })
  description?: string;
  @Field(() => [String], { nullable: true })
  children?: string[];
}

@InputType()
export class AuthRoleUpdateInput {
  @Field(() => String, { nullable: true })
  title?: string;
  @Field(() => String, { nullable: true })
  code?: string;
  @Field(() => String, { nullable: true })
  description?: string;
  @Field(() => [String], { nullable: true })
  children?: string[];
}

@InputType()
export class AuthPermissionInput {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  code!: string;

  @Field(() => String, { nullable: true })
  description?: string;
}

@InputType()
export class ImportAuthRoleInput extends createImportInput({ InputType: AuthRoleInput }) {}

@InputType()
export class ImportAuthPermissionInput extends createImportInput({ InputType: AuthPermissionInput }) {}

@ObjectType()
export class ImportAuthRolePayload extends createImportPayload(AuthRoleObject) {}

@ObjectType()
export class ImportAuthPermissionPayload extends createImportPayload(AuthRoleObject) {}

@ObjectType()
export class AuthRoleListPayload extends createListPayload(AuthRoleObject) {}

@ObjectType()
export class AuthPermissionListPayload extends createListPayload(AuthPermissionObject) {}

@ObjectType()
export class HasRoleListPayload extends createListPayload(HasRoleObject) {}

@Resolver(() => HasRoleObject)
@Injectable()
export class HasRoleResolver {
  @Inject(AccessControlService)
  asc!: AccessControlService;

  @FieldResolver(() => [AuthRoleObject])
  async allRoles(@Root() root: StandardBaseEntity) {
    let em = getEntityManager();
    let repo = em.getRepository(AuthEntityRoleEntity);
    let all = await repo.findAll({
      where: {
        entityId: root.id,
      },
      populate: ['related'],
    });

    let roles: AuthRoleEntity[] = all.map((v) => v.role);
    {
      let byId = _.keyBy(roles, (v) => v.id);
      let found: AuthRoleEntity[] = roles;
      while (found.length) {
        let next = await repo.findAll({
          where: {
            entityId: {
              $in: found.map((v) => v.id),
            },
          },
          populate: ['related'],
        });
        let nextRoles = next.map((v) => v.role);
        // found new roles
        found = nextRoles.filter((v) => !byId[v.id]);
        roles = roles.concat(nextRoles);
        byId = _.keyBy(roles, (v) => v.id);
      }
      roles = Object.values(byId);
    }
    if (root instanceof UserEntity) {
      if (!roles.find((v) => v.code === SystemRole.User)) {
        let usr = await em.getRepository(AuthRoleEntity).findOne({ code: SystemRole.User });
        usr && roles.push(usr);
      }
      // fixme check employee
    }
    return roles;
  }

  @FieldResolver(() => [AuthRoleObject])
  async roles(@Root() root: StandardBaseEntity) {
    let repo = getEntityManager().getRepository(AuthEntityRoleEntity);
    const all = await repo.findAll({
      where: {
        entityId: root.id,
      },
      populate: ['related'],
    });
    return all.map((v) => v.related);
  }

  //
  // @FieldResolver(() => [AuthPermissionObject])
  // async permissions(@Root() root: UserEntity) {
  //   return await root.permissions.load();
  // }
}

@InputType()
export class CreateAuthRoleInput extends RelayMutationInput {
  @Field(() => AuthRoleInput)
  data!: AuthRoleInput;
}

@ObjectType()
export class CreateAuthRolePayload extends RelayMutationInput {
  @Field(() => AuthRoleObject)
  data!: AuthRoleObject;
}

@InputType()
export class UpdateAuthRoleInput extends RelayMutationInput {
  @Field(() => String)
  id!: string;
  @Field(() => AuthRoleUpdateInput)
  data!: AuthRoleUpdateInput;
}

@ObjectType()
export class UpdateAuthRolePayload extends RelayMutationInput {
  @Field(() => AuthRoleObject)
  data!: AuthRoleObject;
}

@InputType()
export class GrantAuthRoleInput extends RelayMutationInput {
  @Field(() => String)
  roleId!: string;
  @Field(() => String)
  entityId!: string;
}

@InputType()
export class RevokeAuthRoleInput extends RelayMutationInput {
  @Field(() => String)
  roleId!: string;
  @Field(() => String)
  entityId!: string;
}

@Resolver(() => AuthRoleObject)
@Injectable()
export class AuthRoleResolver extends mixin(
  createBaseEntityResolver({
    ObjectType: AuthRoleObject,
    EntityType: AuthRoleEntity,
    ServiceType: AuthRoleService,
  }),
  withBaseQuery,
) {
  @Inject(AccessControlService) private readonly acs!: AccessControlService;

  @Authorized(SystemRole.SystemAdmin)
  @Mutation(() => ImportAuthRolePayload)
  async importAuthRole(@Arg('input') input: ImportAuthRoleInput) {
    return runRelayClientMutation(input, async () => {
      const { data } = await this.acs.importRole(input);
      return {
        data: data,
      };
    });
  }

  @Authorized(SystemRole.SystemAdmin)
  @FieldResolver(() => [AuthPermissionObject])
  async permissions(@Root() root: AuthRoleEntity) {
    return await root.permissions.load();
  }

  // @Authorized(SystemRole.SystemAdmin)
  // @FieldResolver(() => [AuthRoleObject])
  // async children(@Root() root: AuthRoleEntity) {
  //   return root.children.loadItems();
  // }

  @Authorized(SystemRole.SystemAdmin)
  @Mutation(() => CreateAuthRolePayload)
  async createAuthRole(@Arg('input', () => CreateAuthRoleInput) input: CreateAuthRoleInput) {
    return runRelayClientMutation(input, async () => {
      const data = await this.svc.create(input);
      return { data };
    });
  }

  @Authorized(SystemRole.SystemAdmin)
  @Mutation(() => UpdateAuthRolePayload)
  async updateAuthRole(@Arg('input', () => UpdateAuthRoleInput) input: UpdateAuthRoleInput) {
    return runRelayClientMutation(input, async () => {
      const data = await this.svc.patch(input);
      return { data };
    });
  }

  @Authorized(SystemRole.SystemAdmin)
  @Mutation(() => DeleteEntityPayload)
  async deleteAuthRole(@Arg('input', () => DeleteEntityInput) input: DeleteEntityInput) {
    return runRelayClientMutation(input, async () => {
      const data = await this.svc.delete(input);
      return { data };
    });
  }

  @Authorized(SystemRole.SystemAdmin)
  @Mutation(() => RelayMutationPayload)
  async grantAuthRole(@Arg('input', () => GrantAuthRoleInput) input: GrantAuthRoleInput) {
    return runRelayClientMutation(input, async () => {
      const data = await this.svc.grant(input);
      return { data };
    });
  }

  @Authorized(SystemRole.SystemAdmin)
  @Mutation(() => RelayMutationPayload)
  async revokeAuthRole(@Arg('input', () => RevokeAuthRoleInput) input: RevokeAuthRoleInput) {
    return runRelayClientMutation(input, async () => {
      const data = await this.svc.revoke(input);
      return { data };
    });
  }

  @FieldResolver(() => HasRoleListPayload)
  async findEntity(@Root() root: AuthRoleEntity, @Info() info: GraphQLResolveInfo) {
    const fields = info.fieldNodes[0].selectionSet?.selections.map((selection) => (selection as any).name.value) || [];

    const [data, total] = await getEntityManager().getRepository(AuthEntityRoleEntity).findAndCount({
      related: root,
    });
    let all = await Promise.all(
      data.map((v) =>
        v.entity.load({
          dataloader: true,
        }),
      ),
    );
    return {
      data: all,
      total,
    };
  }

  // @Authorized(SystemRole.SystemAdmin)
  // @FieldResolver(() => UserListPayload)
  // async findSubject(@Root() root: AuthRoleEntity, @Arg('query', () => ListQueryInput) input: ListQueryInput) {}
}

@Resolver(() => AuthPermissionObject)
@Injectable()
export class AuthPermissionResolver extends mixin(
  createBaseEntityResolver({
    ObjectType: AuthPermissionObject,
    EntityType: AuthPermissionEntity,
    ServiceType: AuthPermissionService,
  }),
  withBaseQuery,
) {
  @Inject(AccessControlService) private readonly acs!: AccessControlService;

  @Authorized(SystemRole.SystemAdmin)
  @Mutation(() => ImportAuthPermissionPayload)
  async importAuthPermission(@Arg('input') input: ImportAuthPermissionInput) {
    return runRelayClientMutation(input, async () => {
      const { data } = await this.acs.importPermission(input);
      return {
        data: data,
      };
    });
  }

  @FieldResolver(() => [AuthRoleObject])
  async roles(@Root() root: AuthPermissionEntity) {
    return await root.roles.load();
  }
}

@Resolver()
@Injectable()
export class AccessControlResolver {
  constructor(
    @Inject(AccessControlService) private readonly acs: AccessControlService,
    @Inject(EntityManager) private readonly em: EntityManager,
  ) {}
}
