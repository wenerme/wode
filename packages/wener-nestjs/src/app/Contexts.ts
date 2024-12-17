import type { IncomingMessage } from 'node:http';
import { Errors } from '@wener/utils';
import { Currents } from '../Currents';

export const Contexts = {
  requestId: Currents.create<string>('RequestId'),
  tenantId: Currents.create<string>('TenantId'),
  clientId: Currents.create<string>('ClientId'),
  sessionId: Currents.create<string>('SessionId'),
  userId: Currents.create<string>('UserId'),
  request: Currents.create<IncomingMessage>('http.Request'),
};

export function setCurrentContext({
  userId,
  tenantId,
  sessionId,
  clientId,
  requestId,
  request,
}: {
  tenantId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  clientId?: string;
  request?: IncomingMessage;
}) {
  tenantId && Contexts.tenantId.set(tenantId);
  userId && Contexts.userId.set(userId);
  sessionId && Contexts.sessionId.set(sessionId);
  clientId && Contexts.clientId.set(clientId);
  requestId && Contexts.requestId.set(requestId);
  request && Contexts.request.set(request);
}

export function getCurrentContext() {
  return {
    tenantId: Contexts.tenantId.get(),
    userId: Contexts.userId.get(),
    sessionId: Contexts.sessionId.get(),
    clientId: Contexts.clientId.get(),
    requestId: Contexts.requestId.get(),
    request: Contexts.request.get(),
  };
}

export function getStaticTenantId() {
  return process.env.TENANT_ID;
}

let _FALLBACK_TENANT_ID = 'org_00000000000000000000000000';

export function getFallbackTenantId() {
  return _FALLBACK_TENANT_ID;
}

export function setFallbackTenantId(id: string) {
  _FALLBACK_TENANT_ID = id;
}

export function getCurrentTenantId() {
  return Contexts.tenantId.get() || getStaticTenantId();
}

export function getCurrentFallbackTenantId() {
  return getCurrentTenantId() || getFallbackTenantId();
}

export function getCurrentUserId() {
  return Contexts.userId.get();
}

export function requireTenantId() {
  const tid = getCurrentTenantId();
  Errors.InternalServerError.check(tid, 'Missing tenant id');
  return tid;
}
