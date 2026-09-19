import { Injectable } from '@nestjs/common';
import { Contexts } from '@wener/server/app';
import { createBaseEntityResolver, createListPayload, withBaseQuery } from '@wener/server/type-graphql';
import { Errors, mixin } from '@wener/utils';
import { Authorized, Field, ObjectType, Query, Resolver } from 'type-graphql';
import { OwnerNode } from '@/foundation/ResourceOwner/OwnerNode';
import { UserEntity } from '@/foundation/User/UserEntity';
import { UserService } from '@/foundation/User/UserService';
import { HasRoleObject } from '@/graph/HasRoleObject';
import { TenantBaseObject } from '@/graph/TenantBaseObject';

@ObjectType('UserProfile')
export class UserProfileObject extends TenantBaseObject {
	@Field(() => String)
	fullName!: string;

	@Field(() => String, { nullable: true })
	loginName?: string;

	@Field(() => String, { nullable: true })
	displayName?: string;
}

@ObjectType('User', { implements: [OwnerNode, HasRoleObject] })
export class UserObject extends UserProfileObject {
	@Field(() => String, { nullable: true })
	email?: string;

	@Field(() => String, { nullable: true })
	phoneNumber?: string;
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
	@Query(() => CurrentUserObject)
	async currentUser() {
		const userId = Contexts.userId.get();
		Errors.Unauthorized.check(userId, '未登录');
		const one = await this.repo.findOne({ id: userId });
		Errors.NotFound.check(one, '用户不存在');
		return one;
	}
}
