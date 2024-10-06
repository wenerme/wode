export interface AuditContext {
  tid?: string;
  userId?: string;
  sessionId?: string;
  clientId?: string;
  clientAgent?: string;
  clientIp?: string;
  comment?: string;
  title?: string;
  description?: string;
}

export interface AuditData {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  clientId?: string;
  clientIp?: string;
  clientAgent?: string;
  instanceId?: string;
  metadata?: Record<string, any>;

  title?: string;
  description?: string;
  comment?: string;

  entityId?: string;
  entityType?: string;

  before?: any;
  after?: any;

  actionType?: string;
}
