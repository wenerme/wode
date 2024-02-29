import { RequestContext } from '@mikro-orm/core';
import { firstOfMaybeArray } from '@wener/utils';
import { Currents } from '../../Currents';
import { App, Contexts } from '../../app';
import { getEntityManager } from '../../mikro-orm';
import type { KnownServiceMessageHeaders } from '../types';
import type { ServerMiddleware } from './ServiceRegistry';
import type { ServerRequest } from './types';

export const createServerContextMiddleware = (): ServerMiddleware => (next) => async (req: ServerRequest) =>
  RequestContext.create(getEntityManager(), async () =>
    Currents.run(async () => {
      const headers = req.headers as KnownServiceMessageHeaders;
      set(headers['x-request-id'], (v) => {
        Contexts.requestId.set(v);
      });
      set(headers['x-tenant-id'], (v) => {
        Contexts.tenantId.set(v);
      });
      set(headers['x-user-id'], (v) => {
        Contexts.userId.set(v);
      });
      set(headers['x-session-id'], (v) => {
        Contexts.sessionId.set(v);
      });
      const res = await next(req);

      res.headers['x-instance-id'] = App.instanceId;
      set(headers['x-tenant-id'], (v) => (res.headers['x-tenant-id'] = v));

      return res;
    }),
  );

function set(val: string | undefined | string[], v: (v: string) => void) {
  val = firstOfMaybeArray(val);
  if (val) {
    v(val);
  }
}
