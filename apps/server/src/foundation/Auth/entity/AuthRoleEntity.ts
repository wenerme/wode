import { types } from '@mikro-orm/core';
import { Entity, Property, Unique } from '@mikro-orm/decorators/legacy';
import { createStateStatusEntity, TenantBaseEntity, withSystemManagedEntity } from '@wener/server/entity';
import { mixin } from '@wener/utils';
import { withRolesEntity } from './withRolesEntity';

const AuthRoleEntityBase = mixin(
	TenantBaseEntity,
	withSystemManagedEntity,
	withRolesEntity,
	createStateStatusEntity({ state: 'Active', status: 'Active' }),
) as typeof TenantBaseEntity;

@Entity({ tableName: 'auth_role' })
@Unique({ properties: ['tid', 'code'] })
export class AuthRoleEntity extends AuthRoleEntityBase {
	systemManaged!: boolean;
	state!: string;
	status!: string;

	@Property({ type: types.string })
	title!: string;

	@Property({ type: types.string })
	code!: string;

	@Property({ type: types.string, nullable: true })
	description?: string;
}
