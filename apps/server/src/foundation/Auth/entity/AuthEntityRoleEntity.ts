import { Entity, ManyToOne, Unique, type Rel } from '@mikro-orm/core';
import { TenantBaseEntity, withRequiredEntityRefEntity } from '@wener/nestjs/entity';
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
