import type { Logger } from '@nestjs/common';
import type { NatsConnection } from 'nats';
import type { ClientConnection, ServerRequest } from '../../service';
import { getRequestSubject } from './nats';
import { requestNatsService } from './requestNatsService';

export interface CreateNatsClientConnectionOptions {
  nc: NatsConnection;
  getSubject?: (req: ServerRequest) => string;
  logger?: Logger;
}

export function createNatsClientConnection({
  nc,
  getSubject = getRequestSubject,
  logger,
}: CreateNatsClientConnectionOptions): ClientConnection {
  return (req) => requestNatsService({ req, logger, subject: getSubject(req), nc });
}
