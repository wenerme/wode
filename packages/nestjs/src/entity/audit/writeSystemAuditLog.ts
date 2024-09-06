import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuditContext } from './types';
import { writeAuditLog } from './writeAuditLog';

export interface WriteSystemAuditLogOptions {
  action?: string;
  context?: AuditContext;
  em?: EntityManager;
  flush?: boolean;
}

export function writeSystemAuditLog({ context, action, ...opts }: WriteSystemAuditLogOptions) {
  return writeAuditLog({
    entity: {
      ...context,
      actionType: action,
    },
    ...opts,
  });
}
