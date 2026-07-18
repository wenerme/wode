import { BaseEntity, Config, type DefineConfig, defineEntity, PrimaryKeyProp, p } from '@mikro-orm/core';

export type StandardBaseEntityOptionalFields =
	| 'id'
	| 'uid'
	| 'createdAt'
	| 'updatedAt'
	| 'sid' // number based serial id
	| 'tid'
	| 'attributes'
	| 'properties'
	| 'extensions';

export const StandardBaseEntitySchema = defineEntity({
	name: 'StandardBaseEntity',
	abstract: true,
	extends: BaseEntity,
	properties: {
		id: p.string().primary().defaultRaw('public.gen_ulid()'),
		uid: p.uuid().columnType('uuid').defaultRaw('gen_random_uuid()').unique(),
		eid: p.string().nullable(),
		createdAt: p.datetime().defaultRaw('current_timestamp'),
		updatedAt: p
			.datetime()
			.defaultRaw('current_timestamp')
			.onUpdate(() => new Date()),
		deletedAt: p.datetime().nullable().hidden(),
		attributes: p.json<Record<string, any>>().default('{}'),
		properties: p.json<Record<string, any>>().default('{}'),
		extensions: p.json<Record<string, any>>().default('{}'),
	},
});

export class StandardBaseEntity extends StandardBaseEntitySchema.class {
	[PrimaryKeyProp]?: 'id';
	[Config]?: DefineConfig<{ forceObject: true }>;
}
StandardBaseEntitySchema.setClass(StandardBaseEntity);
