import { BaseEntity, Entity, PrimaryKey, Property, types } from '@mikro-orm/core';

@Entity({ abstract: true })
export class EnumBaseEntity extends BaseEntity {
  @PrimaryKey({ type: types.string, columnType: 'text' })
  value!: string;

  @Property({ type: types.string, columnType: 'text', nullable: true })
  label?: string;
}
