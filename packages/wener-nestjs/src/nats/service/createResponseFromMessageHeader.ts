import type { MsgHdrs } from 'nats';

export function createResponseFromMessageHeader(
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
