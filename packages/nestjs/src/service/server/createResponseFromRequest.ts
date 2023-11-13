import { Errors, getHttpStatusText, randomUUID } from '@wener/utils';
import type { ServerRequest, ServerResponse } from './types';

export function createResponseFromRequest(
  req: Partial<ServerRequest>,
  { error, code, status, ok, description, ...o }: Partial<ServerResponse> & { error?: any } = {},
): ServerResponse {
  if (error) {
    let detail = Errors.resolve(error);
    status ??= detail.status;
    description = detail.message;
    code = detail.code;
    ok = false;
  } else {
    status ??= 200;
    description = getHttpStatusText(status) || 'Unknown';
  }
  ok ??= status >= 200 && status <= 400;

  return {
    id: req.id || randomUUID(),
    code,
    status,
    ok,
    description,
    headers: {},
    metadata: {},
    body: null,
    ...o,
  };
}
