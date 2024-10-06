import { Entity, ManyToOne, Unique } from '@mikro-orm/core';
import { TenantBaseEntity, withRequiredEntityRefEntity } from '@wener/nestjs/entity';
import { mixin } from '@wener/utils';
import type { AuthPermissionEntity } from './AuthPermissionEntity';
import { AuthRoleEntity } from './AuthRoleEntity';

@Entity({ tableName: 'auth_entity_permission' })
@Unique({ properties: ['tid', 'entityId', 'related'] })
export class AuthEntityPermissionEntity extends mixin(TenantBaseEntity, withRequiredEntityRefEntity) {
  @ManyToOne({ entity: () => AuthRoleEntity })
  related!: AuthPermissionEntity;

  // permission!: AuthPermissionEntity;
}
