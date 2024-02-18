import { BaseEntity, Entity, PrimaryKey, Property, types } from '@mikro-orm/core';

export type MinimalBaseEntityOptionalFields = 'id' | 'uid' | 'createdAt' | 'updatedAt' | 'sid';

@Entity({ abstract: true })
export abstract class MinimalBaseEntity extends BaseEntity {
  @PrimaryKey({ type: types.string, defaultRaw: 'public.gen_ulid()', nullable: false })
  id!: string;

  @Property({ type: types.uuid, columnType: 'uuid', defaultRaw: 'gen_random_uuid()', unique: true, nullable: false })
  uid!: string;

  @Property({ type: types.datetime, defaultRaw: 'current_timestamp' })
  createdAt!: Date;

  @Property({
    type: types.datetime,
    defaultRaw: 'current_timestamp',
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  @Property({ type: types.datetime, nullable: true })
  deletedAt?: Date;
}
