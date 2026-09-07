import { defineEntity, p } from '@mikro-orm/core';
import { setEntitySchemaClass } from '../../entity/defineEntitySchemaClass';
import { MinimalBaseEntity } from './MinimalBaseEntity';

export const MinimalResourceBaseEntitySchema = defineEntity({
	name: 'MinimalResourceBaseEntity',
	abstract: true,
	extends: MinimalBaseEntity,
	properties: {
		eid: p.string().nullable(),
		attributes: p.json<Record<string, any>>().default('{}'),
		properties: p.json<Record<string, any>>().default('{}'),
		extensions: p.json<Record<string, any>>().default('{}'),
	},
});

export abstract class MinimalResourceBaseEntity extends MinimalResourceBaseEntitySchema.class {}
setEntitySchemaClass(MinimalResourceBaseEntitySchema, MinimalResourceBaseEntity, MinimalBaseEntity);
