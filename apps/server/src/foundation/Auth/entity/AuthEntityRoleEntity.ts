import { type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Unique } from '@mikro-orm/decorators/legacy';
import { TenantBaseEntity, withRequiredEntityRefEntity } from '@wener/server/entity';
import { mixin } from '@wener/utils';
import { AuthRoleEntity } from './AuthRoleEntity';

@Entity({ tableName: 'auth_entity_role' })
@Unique({ properties: ['tid', 'entityId', 'related'] })
export class AuthEntityRoleEntity extends mixin(TenantBaseEntity, withRequiredEntityRefEntity) {
	@ManyToOne({ entity: () => AuthRoleEntity })
	related!: Rel<AuthRoleEntity>;

	get role() {
		return this.related;
	}

	set role(role: AuthRoleEntity) {
		this.related = role;
	}
}
