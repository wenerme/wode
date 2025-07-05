import { Entity, Property, types, type Opt } from '@mikro-orm/core';
import { EntitySchema, StandardBaseEntity } from '@wener/nestjs/entity';

@EntitySchema({ idType: 'alppm' })
@Entity({ tableName: 'alpine_pkg_meta' })
export class AlpinePackageMetaEntity extends StandardBaseEntity {
	@Property({ type: types.string, unique: true, generated: '' })
	path!: string & Opt; // ${branch}/${arch}/${channel}/${pkg}-${version}.apk
	@Property({ type: types.string, unique: true, generated: `pkg || '-' || version || '.apk'` })
	filename!: string & Opt; // ${pkg}-${version}.apk
	@Property({ type: types.string, nullable: false })
	branch!: string;
	@Property({ type: types.string, nullable: false })
	channel!: string;
	@Property({ type: types.string, nullable: false })
	arch!: string;
	@Property({ type: types.string, nullable: false })
	pkg!: string;
	@Property({ type: types.string, nullable: false })
	version!: string;

	@Property({ type: types.string })
	checksum!: string;
	@Property({ type: types.string })
	description!: string;
	@Property({ type: types.bigint })
	size!: number;
	@Property({ type: types.bigint })
	installSize!: number;
	@Property({ type: types.string, nullable: true })
	maintainer?: string;
	@Property({ type: types.string })
	origin!: string;
	@Property({ type: types.bigint })
	buildTime!: number;
	@Property({ type: types.string })
	commit!: string;
	@Property({ type: types.string })
	license!: string;
	@Property({ type: types.integer })
	providerPriority?: number;
	@Property({ type: types.string })
	url!: string;
	@Property({ type: types.array })
	depends!: string[];
	@Property({ type: types.array })
	provides!: string[];
	@Property({ type: types.array })
	installIf!: string[];

	@Property({ type: types.string, nullable: true })
	maintainerName?: string;
	@Property({ type: types.string, nullable: true })
	maintainerEmail?: string;
}
