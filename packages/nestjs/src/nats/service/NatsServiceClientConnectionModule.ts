import type { NatsError } from 'nats';
import { headers, type NatsConnection } from 'nats';
import { Logger, Module } from '@nestjs/common';
import { getHttpStatusText } from '../../HttpStatus';
import { NATS_CONNECTION, NatsModule } from '../../nats';
import type { ClientConnection, ClientRequest, ClientResponse } from '../../service';
import { SERVICE_CLIENT_CONNECTION } from '../../service';
import { createResponse } from '../../service/server/createResponse';
import { fromMessageHeader, getRequestSubject } from './nats';

const NATS_SERVICE_CLIENT_CONNECTION = Symbol('NATS_SERVICE_CLIENT_CONNECTION');

@Module({
  imports: [NatsModule],
  providers: [
    {
      provide: NATS_SERVICE_CLIENT_CONNECTION,
      useFactory: (nc: NatsConnection) => {
        return createNatsClientConnection(nc);
      },
      inject: [NATS_CONNECTION],
    },
    {
      provide: SERVICE_CLIENT_CONNECTION,
      useExisting: NATS_SERVICE_CLIENT_CONNECTION,
    },
  ],
  exports: [SERVICE_CLIENT_CONNECTION],
})
export class NatsServiceClientConnectionModule {}

const log = new Logger('NatsServiceClient');

export function createNatsClientConnection(nc: NatsConnection): ClientConnection {
  return async (req) => {
    const { headers: _, options: __, ...write } = req;
    const hdr = headers();
    Object.entries(req.headers).forEach(([k, v]) => {
      hdr.set(k, v);
    });
    try {
      log.debug(`-> ${req.service}:${req.method}`);
      const msg = await nc.request(getRequestSubject(req), JSON.stringify(write), {
        timeout: 5000,
        headers: hdr,
      });

      const res = JSON.parse(msg.string()) as ClientResponse;
      fromMessageHeader(res, msg.headers);
      return res;
    } catch (e) {
      log.error(`Unexpected ${req.service}:${req.method} ${e}`);
      return createErrorResponse({ error: e, req });
    }
  };
}

function createErrorResponse({ error: e, req }: { error: any; req: ClientRequest }) {
  if (e && typeof e === 'object' && 'code' in e) {
    const err = e as NatsError;
    log.error(`NatsError: ${e.code} ${err.message}`);
    switch (e.code) {
      case 'TIMEOUT':
        return createResponse(req, {
          status: 408, // request timeout
          description: err.message,
        });
      case '503':
        return createResponse(req, {
          code: 503,
          description: `${getHttpStatusText(503)}: ${err.message}`,
        });
      default:
        return createResponse(req, {
          code: 500,
          description: err.message,
        });
    }
  }
  return createResponse(req, {
    status: 500,
    description: String(e),
  });
}
