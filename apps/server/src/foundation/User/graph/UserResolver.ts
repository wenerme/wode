import { Injectable } from '@nestjs/common';
import { Contexts } from '@wener/nestjs/app';
import { createBaseEntityResolver, createListPayload, withBaseQuery } from '@wener/nestjs/type-graphql';
import { Errors, mixin } from '@wener/utils';
import { Authorized, Field, ObjectType, Query, Resolver } from 'type-graphql';
import { OwnerNode } from '@/foundation/ResourceOwner/OwnerNode';
import { UserEntity } from '@/foundation/User/entity/UserEntity';
import { UserService } from '@/foundation/User/UserService';
import { HasRoleObject } from '@/graph/HasRoleObject';
import { TenantBaseObject } from '@/graph/TenantBaseObject';

@ObjectType('UserProfile', { implements: [] })
export class UserProfileObject extends TenantBaseObject {
  @Field(() => String)
  fullName!: string;

  @Field(() => String, { nullable: true })
  loginName?: string;

  @Field(() => String, { nullable: true })
  displayName?: string;

  @Field(() => String, { nullable: true })
  jobNumber?: string;

  @Field(() => String, { nullable: true })
  jobTitle?: string;

  @Field(() => Date, { nullable: true })
  birthDate?: Date;

  @Field(() => Date, { nullable: true })
  joinDate?: Date;

  @Field(() => String, { nullable: true })
  photoUrl?: string;
}

@ObjectType('User', { implements: [OwnerNode, HasRoleObject] })
export class UserObject extends UserProfileObject {
  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  mobilePhone?: string;

  @Field(() => String, { nullable: true })
  homePhone?: string;
}

@ObjectType('CurrentUser')
export class CurrentUserObject extends UserObject {}

@ObjectType()
export class UserListPayload extends createListPayload(UserObject) {}

@Resolver(() => UserObject)
@Injectable()
export class UserResolver extends mixin(
  createBaseEntityResolver({
    ObjectType: UserObject,
    EntityType: UserEntity,
    ServiceType: UserService,
    ListPayloadType: UserListPayload,
  }),
  withBaseQuery,
) {
  @Authorized()
  @Query(() => CurrentUserObject, { nullable: false })
  async currentUser() {
    let userId = Contexts.userId.get();
    Errors.Unauthorized.check(userId, '未登录');
    const one = await this.repo.findOne({
      id: userId,
    });
    Errors.NotFound.check(one, '用户不存在');
    return one;
  }

  // 使用相同的对象方便客户端缓存处理

  // @Authorized()
  // @Query(() => UserProfileObject, { nullable: true })
  // async getUserProfile(@Arg('id', () => ID) id: string) {
  //   const one = await this.repo.findOne({
  //     id: id,
  //   });
  //   return one;
  // }
}
