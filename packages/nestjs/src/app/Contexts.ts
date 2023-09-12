import type { IncomingMessage } from 'node:http';
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
