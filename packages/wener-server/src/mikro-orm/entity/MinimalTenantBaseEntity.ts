import { type Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { MinimalBaseEntity } from './MinimalBaseEntity';

@Entity({ abstract: true })
export abstract class MinimalTenantBaseEntity extends MinimalBaseEntity {
	@Property({ nullable: false, name: 'tid', defaultRaw: 'current_tenant_id()' })
	tid!: string & Opt;
}
