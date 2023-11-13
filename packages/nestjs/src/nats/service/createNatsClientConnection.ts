import { Logger } from '@nestjs/common';
import { headers, NatsConnection } from 'nats';
import { ClientConnection, ClientResponse, ServerRequest, ServiceResponsePayloadSchema } from '../../service';
import { createNatsErrorResponse } from './createNatsErrorResponse';
import { fromMessageHeader, getRequestSubject } from './nats';

export interface CreateNatsClientConnectionOptions {
  nc: NatsConnection;
  getSubject?: (req: ServerRequest) => string;
  logger?: Logger;
}

export function createNatsClientConnection({
  nc,
  getSubject = getRequestSubject,
  logger: log = new Logger('NatsServiceClient'),
}: CreateNatsClientConnectionOptions): ClientConnection {
  return async (req) => {
    const { headers: _, options: __, ...write } = req;
    const hdr = headers();
    for (const [k, v] of Object.entries(req.headers)) {
      hdr.set(k, v);
    }

    try {
      log.debug(`-> ${req.service}:${req.method}`);
      const msg = await nc.request(getSubject(req), JSON.stringify(write), {
        timeout: 5000,
        headers: hdr,
      });

      const res = ServiceResponsePayloadSchema.parse(JSON.parse(msg.string())) as ClientResponse;
      res.metadata = {};
      fromMessageHeader(res, msg.headers);
      return res;
    } catch (error) {
      log.error(`Unexpected ${req.service}:${req.method} ${error}`);
      return createNatsErrorResponse({ error, req, logger: log });
    }
  };
}
