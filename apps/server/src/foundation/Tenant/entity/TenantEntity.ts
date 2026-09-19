import { type Opt, types } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { MinimalBaseEntity } from '@wener/server/mikro-orm';

@Entity({ tableName: 'tenant', schema: 'public' })
export class TenantEntity extends MinimalBaseEntity {
	@Property({ type: types.string })
	tid!: string & Opt;

	@Property({ type: types.string })
	displayName!: string;

	@Property({ type: types.string })
	fullName!: string;

	@Property({ type: types.string, nullable: true })
	domainName?: string;
}
