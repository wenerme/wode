import { BaseEntity, types } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ abstract: true })
export class EnumBaseEntity<_E extends EnumBaseEntity<any>> extends BaseEntity {
	@PrimaryKey({ type: types.string, columnType: 'text' })
	value!: string;

	@Property({ type: types.string, columnType: 'text', nullable: true })
	label?: string;
}
