import type { MsgHdrs } from 'nats';
import { headers } from 'nats';

export function fromMessageHeader(
  res: {
    status?: number;
    code?: number | string;
    ok?: boolean;
    description?: string;
    headers?: Record<string, string>;
  },
  hdr?: MsgHdrs,
) {
  if (!hdr) {
    return res;
  }

  res.headers ||= {};
  for (const [k, v] of hdr) {
    res.headers[k] = v.join(',');
  }

  // res.ok = !hdr.hasError;
  // res.status = hdr.status;
  // res.code = hdr.code;
  // res.description = hdr.description;
  return res;
}

export function toMessageHeader(
  res: {
    status?: number;
    code?: number | string;
    ok?: boolean;
    description?: string;
    headers?: Record<string, string>;
  },
  hdr?: MsgHdrs,
) {
  hdr ??= headers();
  // if (res.status) hdr.status = res.status;
  // if (res.code) hdr.code = res.code;
  // if (res.description) hdr.description = res.description;
  // if (res.ok ?? false) hdr.hasError = !res.ok;
  for (const [k, v] of Object.entries(res.headers || {})) {
    hdr.set(k, v as any);
  }

  return hdr;
}

/*
wener.UserService -> service.wener/UserService

能够实现 remapping
serive.wener.UserService 方式需要 `>` - 不支持 remapping
 */

export function getRequestSubject({ service, method }: { service: string; method: string }) {
  return `service.${service.replaceAll('.', '/')}.${method}`;
}

export function getSubscribeSubject({ service }: { service: string }) {
  return [
    `service.${service.replaceAll('.', '/')}`,
    `service.${service.replaceAll('.', '/')}.*`, // for method
  ];
}
