import { Entity, Property, types, Unique } from '@mikro-orm/core';
import { TenantBaseEntity, withSystemManagedEntity } from '@wener/nestjs/entity';
import { mixin } from '@wener/utils';

@Entity({ tableName: 'auth_permission' })
@Unique({ properties: ['tid', 'code'] })
export class AuthPermissionEntity extends mixin(TenantBaseEntity, withSystemManagedEntity) {
  @Property({ type: types.string })
  title!: string;

  @Property({ type: types.string })
  code!: string;

  @Property({ type: types.string, nullable: true })
  description?: string;

  @Property({ type: types.json, nullable: false })
  metadata: Record<string, any> = {};
}
