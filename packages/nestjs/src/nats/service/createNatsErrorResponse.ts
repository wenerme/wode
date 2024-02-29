import { Logger } from '@nestjs/common';
import { getHttpStatusText } from '@wener/utils';
import { NatsError } from 'nats';
import { ClientRequest, createResponseFromRequest } from '../../service';

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
        return createResponseFromRequest(req, {
          status: 408, // request timeout
          description: err.message,
        });
      }

      case '503': {
        return createResponseFromRequest(req, {
          code: 503,
          description: `${getHttpStatusText(503)}: ${err.message}`,
        });
      }

      default: {
        return createResponseFromRequest(req, {
          code: 500,
          description: err.message,
        });
      }
    }
  }

  return createResponseFromRequest(req, {
    status: 500,
    description: String(e),
  });
}
