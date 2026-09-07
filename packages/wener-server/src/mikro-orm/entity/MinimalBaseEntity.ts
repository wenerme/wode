import { BaseEntity, defineEntity, p } from '@mikro-orm/core';

export type MinimalBaseEntityOptionalFields =
	| 'id'
	| 'uid'
	| 'createdAt'
	| 'updatedAt'
	| 'sid' // number based serial id
	| 'tid'
	| 'attributes'
	| 'properties'
	| 'extensions';

/**
 * Add Minimal prefix to avoid conflict with real entity, MikroORM not allowed different entity with same name
 */
export const MinimalBaseEntitySchema = defineEntity({
	name: 'MinimalBaseEntity',
	abstract: true,
	extends: BaseEntity,
	properties: {
		id: p.string().primary().defaultRaw('public.gen_ulid()'),
		uid: p.uuid().columnType('uuid').defaultRaw('gen_random_uuid()').unique(),
		createdAt: p.datetime().defaultRaw('current_timestamp'),
		updatedAt: p
			.datetime()
			.defaultRaw('current_timestamp')
			.onUpdate(() => new Date()),
		deletedAt: p.datetime().nullable(),
	},
});

export abstract class MinimalBaseEntity extends MinimalBaseEntitySchema.class {}
MinimalBaseEntitySchema.setClass(MinimalBaseEntity);
