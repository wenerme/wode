import { defineEntity, p } from '@mikro-orm/core';
import { setEntitySchemaClass } from '../../entity/defineEntitySchemaClass';
import { MinimalBaseEntity } from './MinimalBaseEntity';

export const MinimalTenantBaseEntitySchema = defineEntity({
	name: 'MinimalTenantBaseEntity',
	abstract: true,
	extends: MinimalBaseEntity,
	properties: {
		tid: p.string().fieldName('tid').defaultRaw('current_tenant_id()'),
	},
});

export abstract class MinimalTenantBaseEntity extends MinimalTenantBaseEntitySchema.class {}
setEntitySchemaClass(MinimalTenantBaseEntitySchema, MinimalTenantBaseEntity, MinimalBaseEntity);
