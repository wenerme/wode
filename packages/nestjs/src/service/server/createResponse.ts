import { randomUUID } from '@wener/utils';
import type { ServerRequest, ServerResponse } from './types';

export function createResponse(
  req: Partial<ServerRequest>,
  { code = 0, ok = code === 0 || code === 200, ...o }: Partial<ServerResponse> = {},
): ServerResponse {
  return {
    id: req.id || randomUUID(),
    code,
    status: 'OK',
    ok,
    description: `Handle ${req.service}.${req.method}`,
    headers: {},
    metadata: {},
    output: null,
    ...o,
  };
}
