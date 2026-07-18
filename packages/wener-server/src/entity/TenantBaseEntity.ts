import { defineEntity, p } from '@mikro-orm/core';
import { getCurrentTenantId } from '../app';
import { CurrentTenantIdFilter } from './CurrentTenantIdFilter';
import { setEntitySchemaClass } from './defineEntitySchemaClass';
import { StandardBaseEntity } from './StandardBaseEntity';

export type TenantBaseEntityOptionalFields =
	| 'id'
	| 'uid'
	| 'createdAt'
	| 'updatedAt'
	| 'sid' // number based serial id
	| 'tid'
	| 'attributes'
	| 'properties'
	| 'extensions'
	| 'metadata'
	| 'ownerUser'
	| 'ownerTeam'
	| 'ownerUserId'
	| 'ownerTeamId';

export const TenantBaseEntitySchema = defineEntity({
	name: 'TenantBaseEntity',
	abstract: true,
	extends: StandardBaseEntity,
	filters: { [CurrentTenantIdFilter.name]: CurrentTenantIdFilter },
	uniques: [{ properties: ['tid', 'eid'] }],
	hooks: { beforeCreate: ['setTenantBeforeCreate'] },
	properties: {
		tid: p.string().defaultRaw('public.current_tenant_id()'),
	},
});

export class TenantBaseEntity extends TenantBaseEntitySchema.class {
	setTenantBeforeCreate() {
		// TidFilter 不会处理 create
		this.tid ||= getCurrentTenantId() || this.tid;
	}

	// upsert bind 有问题
}
setEntitySchemaClass(TenantBaseEntitySchema, TenantBaseEntity, StandardBaseEntity);
