import { defineEntity, p } from '@mikro-orm/core';
import { setEntitySchemaClass } from '../defineEntitySchemaClass';
import { TenantBaseEntity } from '../TenantBaseEntity';

export const AuditLogEntitySchema = defineEntity({
	name: 'AuditLogEntity',
	tableName: 'audit_log',
	extends: TenantBaseEntity,
	properties: {
		requestId: p.string().nullable(),
		userId: p.string().nullable(),
		sessionId: p.string().nullable(),
		clientId: p.string().nullable(),
		instanceId: p.string().nullable(),
		title: p.string().nullable(),
		description: p.string().nullable(),
		comment: p.string().nullable(),
		entityId: p.string().nullable(),
		entityType: p.string().nullable(),
		clientAgent: p.string().nullable(),
		clientIp: p.string().nullable(),
		actionType: p.string().nullable(),
		before: p.json<Record<string, any>>().nullable(),
		after: p.json<Record<string, any>>().nullable(),
		metadata: p.json<Record<string, any>>().nullable(),
	},
});

export class AuditLogEntity extends AuditLogEntitySchema.class {}
setEntitySchemaClass(AuditLogEntitySchema, AuditLogEntity, TenantBaseEntity);
