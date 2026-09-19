import { BaseEntity, types } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

export type MinimalOptionalEntityFields = 'id' | 'uid' | 'createdAt' | 'updatedAt' | 'sid';

@Entity({ abstract: true })
export abstract class MinimalBaseEntity<_E extends MinimalBaseEntity<any>> extends BaseEntity {
	// [OptionalProps]?: MinimalOptionalEntityFields;

	@PrimaryKey({ type: types.string, defaultRaw: 'public.gen_ulid()', nullable: false })
	id!: string;

	@Property({ type: types.uuid, columnType: 'uuid', defaultRaw: `gen_random_uuid()`, unique: true, nullable: false })
	uid!: string;

	// @Property({type: types.string, nullable: true})
	// eid?: string;

	// @Property({type: types.bigint, defaultRaw: `gen_next_sid()`, nullable: false, unique: true})
	// sid?:number

	@Property({ type: types.datetime, defaultRaw: 'current_timestamp' })
	createdAt!: Date;

	@Property({ type: types.datetime, defaultRaw: 'current_timestamp', onUpdate: () => new Date() })
	updatedAt!: Date;

	@Property({ type: types.datetime, nullable: true })
	deletedAt?: Date;
}
