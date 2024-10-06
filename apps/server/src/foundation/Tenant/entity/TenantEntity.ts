import { Entity, Property, types, type Opt } from '@mikro-orm/core';
import { MinimalBaseEntity } from '@wener/nestjs/mikro-orm';

@Entity({ tableName: 'tenant', schema: 'public' })
export class TenantEntity extends MinimalBaseEntity {
  @Property({ type: types.string })
  tid!: string & Opt;

  @Property({ type: types.string })
  displayName!: string;

  @Property({ type: types.string })
  fullName!: string;
}
