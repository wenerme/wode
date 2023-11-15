import { Entity, OptionalProps, Property, types } from '@mikro-orm/core';
import { WodeTenantBaseEntity, type TenantBaseEntityOptionalFields } from './WodeTenantBaseEntity';

@Entity({ tableName: 'audit_log' })
export class AuditLogEntity extends WodeTenantBaseEntity<AuditLogEntity> {
  [OptionalProps]?: TenantBaseEntityOptionalFields;

  @Property({ type: types.string, nullable: true })
  requestId?: string;

  @Property({ type: types.string, nullable: true })
  userId?: string;

  @Property({ type: types.string, nullable: true })
  sessionId?: string;

  @Property({ type: types.string, nullable: true })
  clientId?: string;

  @Property({ type: types.string, nullable: true })
  instanceId?: string;

  @Property({ type: types.string, nullable: true })
  title?: string;

  @Property({ type: types.string, nullable: true })
  description?: string;

  @Property({ type: types.string, nullable: true })
  comment?: string;

  @Property({ type: types.string, nullable: true })
  entityId?: string;

  @Property({ type: types.string, nullable: true })
  entityType?: string;

  @Property({ type: types.string, nullable: true })
  clientAgent?: string;

  @Property({ type: types.string, nullable: true })
  clientIp?: string;

  @Property({ type: types.string, nullable: true })
  actionType?: string;

  @Property({ type: types.json, nullable: true })
  before?: Record<string, any>;

  @Property({ type: types.json, nullable: true })
  after?: Record<string, any>;

  @Property({ type: types.json, nullable: true })
  metadata?: Record<string, any>;
}
