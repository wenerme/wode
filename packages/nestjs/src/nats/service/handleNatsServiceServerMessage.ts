import { Msg } from 'nats';
import { Logger } from '@nestjs/common';
import {
  ServerRequest,
  ServerResponse,
  ServiceRegistry,
  ServiceRequestPayloadSchema,
  ServiceResponsePayloadSchema,
} from '../../service';
import { createResponse } from '../../service/server/createResponse';
import { fromMessageHeader, toMessageHeader } from './nats';
import { KnownNatsServerMetadata } from './types';

export async function handleNatsServiceServerMessage({
  msg,
  registry: svc,
  logger: log = new Logger(`NatsServiceServerHandler`),
}: {
  msg: Msg;
  registry: ServiceRegistry;
  logger?: Logger;
}) {
  let res: ServerResponse | undefined;
  let cause: any | undefined;
  let req: ServerRequest;
  try {
    req = Object.assign({ metadata: {} }, ServiceRequestPayloadSchema.parse(JSON.parse(msg.string())));
    fromMessageHeader(req, msg.headers);
  } catch (error) {
    msg.respond(
      JSON.stringify(
        createResponse(
          {},
          {
            code: 400,
            description: `Invalid request: ${String(error)}`,
          },
        ),
      ),
      {},
    );
    return;
  }

  const meta = req.metadata as KnownNatsServerMetadata;
  meta.NatsMsg = msg;

  try {
    res = await svc.handle(req);
  } catch (error) {
    cause = error;
  }

  if (!res) {
    if (cause) {
      log.error(`Handle ${req.service}#${req.method} error: ${cause}`);
      res = createResponse(req, {
        status: 500,
        description: String(cause),
      });
    } else if (!res) {
      res = createResponse(req, {
        status: 500,
        description: 'Invalid Response',
      });
    }
  }

  const { headers: _, ...write } = ServiceResponsePayloadSchema.parse(res);
  const hdr = toMessageHeader(res);
  msg.respond(JSON.stringify(write), {
    headers: hdr,
  });
}
