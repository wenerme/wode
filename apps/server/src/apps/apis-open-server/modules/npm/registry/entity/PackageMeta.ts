import { BaseEntity, Entity, OptionalProps, PrimaryKey, Property, types } from '@mikro-orm/core';
import { type RegistryPackage } from '@wener/unpkg';

@Entity({ schema: 'npm' })
export class PackageMeta extends BaseEntity<PackageMeta, 'id'> {
  [OptionalProps]?: 'id' | 'createdAt' | 'updatedAt';

  @PrimaryKey({ type: types.string, defaultRaw: `gen_random_uuid()` })
  id!: string;

  @Property({ type: types.datetime, defaultRaw: 'current_timestamp' })
  createdAt!: Date;

  @Property({
    type: types.datetime,
    defaultRaw: 'current_timestamp',
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  @Property({ type: types.string, unique: true, nullable: false })
  name!: string;

  @Property({ type: types.json, nullable: false })
  meta!: RegistryPackage;
}
