import { Entity, Property, types, Unique } from '@mikro-orm/core';
import { createStateStatusEntity, TenantBaseEntity, withSystemManagedEntity } from '@wener/nestjs/entity';
import { mixin } from '@wener/utils';
import { withRolesEntity } from './withRolesEntity';

@Entity({ tableName: 'auth_role' })
@Unique({ properties: ['tid', 'code'] })
export class AuthRoleEntity extends mixin(
  TenantBaseEntity,
  withSystemManagedEntity,
  withRolesEntity,
  createStateStatusEntity({
    state: 'Active',
    status: 'Active',
  }),
) {
  @Property({ type: types.string })
  title!: string;

  @Property({ type: types.string })
  code!: string;

  @Property({ type: types.string, nullable: true })
  description?: string;
}
