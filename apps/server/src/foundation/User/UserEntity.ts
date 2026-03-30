import { Entity, Property, types, Unique, type Hidden } from '@mikro-orm/core';
import { TenantBaseEntity, withStateStatusEntity } from '@wener/server/entity';
import { mixin } from '@wener/utils';
import { hashPassword } from '@/foundation/User/actions/hashPassword';
import { validatePassword } from '@/foundation/User/actions/validatePassword';

@Entity({ tableName: 'users' })
@Unique({ properties: ['tid', 'loginName'] })
@Unique({ properties: ['tid', 'email'] })
export class UserEntity extends mixin(
	TenantBaseEntity,
	withStateStatusEntity({
		state: 'Active',
		status: 'Active',
	}),
) {
	@Property({ type: types.string })
	fullName!: string;

	@Property({ type: types.string, nullable: true })
	displayName?: string;

	@Property({ type: types.string, nullable: true })
	loginName?: string;

	@Property({ type: types.string, nullable: true })
	email?: string;

	@Property({ type: types.string, nullable: true })
	phoneNumber?: string;

	@Property({ type: types.string, nullable: true })
	phoneNumberVerifiedAt?: Date;

	@Property({ type: types.string, nullable: true, hidden: true })
	password?: string & Hidden;

	@Property({ type: types.string, nullable: true })
	notes?: string;

	@Property({ type: types.boolean, default: false })
	admin = false;

	async isPasswordMatch(password: string) {
		return validatePassword({ password: password, hash: this.password }).then((v) => v.success);
	}

	async setPassword(password: string) {
		this.password = await hashPassword(password);
	}
}
