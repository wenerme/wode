import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuditContext } from './types';
import { writeAuditLog } from './writeAuditLog';

export interface WriteUserAuditLogOptions {
  action: string;
  user?: { id: string; tid?: string } | undefined;
  context?: AuditContext;
  em?: EntityManager;
  flush?: boolean;
  sessionId?: string;
  userId?: string;
}

export function writeUserAuditLog({
  em,
  flush,
  sessionId,
  userId,
  context = {},
  action,
  user,
}: WriteUserAuditLogOptions) {
  context.tid ||= user?.tid;
  context.userId ||= userId || user?.id;
  context.sessionId ||= sessionId;

  if (!context?.userId) {
    throw new Error('No user id in audit context');
  }

  return writeAuditLog({
    em,
    flush,
    entity: {
      ...context,
      actionType: action,
    },
  });
}
