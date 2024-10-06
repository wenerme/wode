import { Entity, Property, types } from '@mikro-orm/core';
import { TenantBaseEntity } from '@wener/nestjs/entity';

@Entity({
  abstract: true,
})
export class BaseTenantDictEntity extends TenantBaseEntity {
  @Property({ type: types.string, nullable: false })
  label!: string;

  @Property({ type: types.json, nullable: false, defaultRaw: "'V' || public.gen_random_uuid()" })
  value!: string;

  @Property({ type: types.string, nullable: true })
  description?: string;

  @Property({ type: types.integer, nullable: false, default: 0 })
  displayOrder!: number;

  @Property({ type: types.boolean, nullable: false, default: true })
  active!: boolean;

  @Property({ type: types.json, nullable: false, default: '{}' })
  metadata!: Record<string, any>;
}
