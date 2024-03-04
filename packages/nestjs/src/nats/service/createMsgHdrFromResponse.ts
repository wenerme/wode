import { headers, type MsgHdrs } from 'nats';

export function createMsgHdrFromResponse(
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
