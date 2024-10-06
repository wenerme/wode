import type { EntityManager } from '@mikro-orm/postgresql';
import { Contexts } from '@wener/nestjs/app';
import { EntityAuditAction } from './enum';
import type { AuditContext } from './types';
import { writeAuditLog } from './writeAuditLog';

export interface WriteEntityAuditLogOptions {
  entity: any;
  before?: any;
  after?: any;
  action: string;
  comment?: string;
  em?: EntityManager;
  context?: AuditContext;
}

export function writeEntityChangelog(opts: Omit<WriteEntityAuditLogOptions, 'action'> & {}) {
  return writeEntityAuditLog({
    after: asObject(opts.entity),
    ...opts,
    action: EntityAuditAction.Change,
  });
}

function asObject(s: any) {
  if ('toJSON' in s) {
    return s.toJSON();
  }
  return structuredClone(s);
}

export function writeEntityAuditLog({
  em,
  entity,
  before,
  action,
  after,
  comment,
  context = {},
}: WriteEntityAuditLogOptions) {
  context.tid ||= entity.tid || Contexts.tenantId.get();

  return writeAuditLog({
    em,
    entity: {
      comment,
      ...context,
      entityId: entity.id,
      entityType: entity.constructor.name.replace(/Entity$/, ''),
      actionType: action,
      before,
      after,
    },
  });
}
