import { Logger } from '@nestjs/common';
import { headers, type NatsConnection } from 'nats';
import { ServiceResponsePayloadSchema, type ClientRequest, type ClientResponse } from '../../service';
import { createNatsErrorResponse } from './createNatsErrorResponse';
import { createResponseFromMessageHeader } from './createResponseFromMessageHeader';

export async function requestNatsService({
  nc,
  logger: log = new Logger('NatsServiceClient'),
  req,
  subject,
}: {
  nc: NatsConnection;
  logger?: Logger;
  subject: string;
  req: ClientRequest;
}) {
  const { headers: _, options: __, ...write } = req;
  const hdr = headers();
  for (const [k, v] of Object.entries(req.headers)) {
    hdr.set(k, v);
  }

  try {
    log.debug(`-> ${req.service}:${req.method} by ${subject}`);
    const msg = await nc.request(subject, JSON.stringify(write), {
      timeout: 5000,
      headers: hdr,
    });

    const res = ServiceResponsePayloadSchema.parse(JSON.parse(msg.string())) as ClientResponse;
    res.metadata = {};
    createResponseFromMessageHeader(res, msg.headers);
    return res;
  } catch (error) {
    log.error(`Unexpected ${req.service}:${req.method} ${error}`);
    return createNatsErrorResponse({ error, req, logger: log });
  }
}
