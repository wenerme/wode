import { Entity, Property, types, type Opt } from '@mikro-orm/core';
import { EntitySchema, StandardBaseEntity } from '@wener/server/entity';

@EntitySchema({ idType: 'alprm' })
@Entity({ tableName: 'alpine_repo_meta' })
export class AlpineRepoMetaEntity extends StandardBaseEntity {
	@Property({ type: types.string, generated: `branch || '/' || channel || '/' || arch`, unique: true })
	path!: string & Opt; // ${branch}/${channel}/${arch}

	@Property({ type: types.string })
	branch!: string;
	@Property({ type: types.string })
	channel!: string;
	@Property({ type: types.string })
	arch!: string;

	@Property({ type: types.string, nullable: true })
	description?: string;
	@Property({ type: types.string, default: '' })
	content!: string & Opt;
	@Property({ type: types.string })
	lastModifiedTime!: Date;
	@Property({ type: types.string })
	version!: string;
	@Property({ type: types.integer, default: 0 })
	size!: number & Opt;
}
