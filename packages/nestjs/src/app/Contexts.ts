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
