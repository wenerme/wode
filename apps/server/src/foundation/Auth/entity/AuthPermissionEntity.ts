import { types } from '@mikro-orm/core';
import { Entity, Property, Unique } from '@mikro-orm/decorators/legacy';
import { TenantBaseEntity, withSystemManagedEntity } from '@wener/server/entity';
import { mixin } from '@wener/utils';

const AuthPermissionEntityBase = mixin(TenantBaseEntity, withSystemManagedEntity) as typeof TenantBaseEntity;

@Entity({ tableName: 'auth_permission' })
@Unique({ properties: ['tid', 'code'] })
export class AuthPermissionEntity extends AuthPermissionEntityBase {
	systemManaged!: boolean;

	@Property({ type: types.string })
	title!: string;

	@Property({ type: types.string })
	code!: string;

	@Property({ type: types.string, nullable: true })
	description?: string;

	@Property({ type: types.json, nullable: false })
	metadata: Record<string, any> = {};
}
