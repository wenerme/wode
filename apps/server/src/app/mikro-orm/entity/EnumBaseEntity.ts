import { BaseEntity, Entity, PrimaryKey, Property, types } from '@mikro-orm/core';

@Entity({ abstract: true })
export class EnumBaseEntity<E extends EnumBaseEntity<any>> extends BaseEntity<E, 'value'> {
  @PrimaryKey({ type: types.string, columnType: 'text' })
  value!: string;

  @Property({ type: types.string, columnType: 'text', nullable: true })
  label?: string;
}
