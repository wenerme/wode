import { NatsError } from 'nats';
import { Logger } from '@nestjs/common';
import { getHttpStatusText } from '../../HttpStatus';
import { ClientRequest } from '../../service';
import { createResponse } from '../../service/server/createResponse';

export function createNatsErrorResponse({
  error: e,
  req,
  logger: log = new Logger('NatsErrorResponse'),
}: {
  error: any;
  req: ClientRequest;
  logger?: Logger;
}) {
  if (e && typeof e === 'object' && 'code' in e) {
    const err = e as NatsError;
    log.error(`NatsError: ${e.code} ${err.message}`);
    switch (e.code) {
      case 'TIMEOUT': {
        return createResponse(req, {
          status: 408, // request timeout
          description: err.message,
        });
      }

      case '503': {
        return createResponse(req, {
          code: 503,
          description: `${getHttpStatusText(503)}: ${err.message}`,
        });
      }

      default: {
        return createResponse(req, {
          code: 500,
          description: err.message,
        });
      }
    }
  }

  return createResponse(req, {
    status: 500,
    description: String(e),
  });
}
