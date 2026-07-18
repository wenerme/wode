import { BaseEntity, defineEntity, p } from '@mikro-orm/core';

export const MinimalEnumBaseEntitySchema = defineEntity({
	name: 'MinimalEnumBaseEntity',
	abstract: true,
	extends: BaseEntity,
	properties: {
		value: p.string().columnType('text').primary(),
		label: p.string().columnType('text').nullable(),
	},
});

export class MinimalEnumBaseEntity extends MinimalEnumBaseEntitySchema.class {}
MinimalEnumBaseEntitySchema.setClass(MinimalEnumBaseEntity);
