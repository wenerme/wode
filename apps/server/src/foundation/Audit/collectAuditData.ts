import { App, Contexts } from '@wener/nestjs/app';
import { firstOfMaybeArray } from '@wener/utils';
import type { AuditData } from './types';

export function collectAuditData<T extends AuditData>(data: T): T {
  data.requestId ||= Contexts.requestId.get();
  data.userId ||= Contexts.userId.get();
  data.sessionId ||= Contexts.sessionId.get();
  data.clientId ||= Contexts.clientId.get();

  const meta = (data.metadata ||= {});
  const req = Contexts.request.get();
  if (req) {
    const { ip, method, url, originalUrl, path = originalUrl } = req as any;
    const userAgent = (req as any).headers?.['user-agent'] || '';
    data.clientAgent = userAgent;
    // https://github.com/pbojinov/request-ip/blob/master/src/index.js#L55
    data.clientIp =
      ip ||
      firstOfMaybeArray(req.headers?.['cf-connecting-ip']) ||
      firstOfMaybeArray(req.headers?.['x-client-ip']) ||
      firstOfMaybeArray(req.headers?.['cf-pseudo-ipv4']) ||
      firstOfMaybeArray(req.headers?.['x-forwarded-for']) ||
      req.socket.remoteAddress;
    meta.method = method;
    meta.path = path;
    if (url !== path) {
      meta.url = url;
    }
    // fixme conditional
    meta.headers = req.headers;
  }

  data.instanceId ||= App.instanceId;
  return data;
}

interface KnownHttpMetadata {
  method?: string;
  path?: string;
  url?: string;
  headers?: Record<string, string | string[]>;
}
