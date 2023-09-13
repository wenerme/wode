import { randomUUID } from '@wener/utils';
import { getHttpStatusText } from '../../HttpStatus';
import type { ServerRequest, ServerResponse } from './types';

export function createResponse(
  req: Partial<ServerRequest>,
  {
    code,
    status = 200,
    ok = status >= 200 && status <= 400,
    description = getHttpStatusText(status) || 'Unknown',
    ...o
  }: Partial<ServerResponse> = {},
): ServerResponse {
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
