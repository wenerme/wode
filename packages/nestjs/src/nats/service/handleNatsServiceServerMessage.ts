import { Logger } from '@nestjs/common';
import { Msg } from 'nats';
import {
  ServerRequest,
  ServerResponse,
  ServiceRegistry,
  ServiceRequestPayloadSchema,
  ServiceResponsePayloadSchema,
} from '../../service';
import { createResponseFromRequest } from '../../service';
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
        createResponseFromRequest(
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
      res = createResponseFromRequest(req, {
        status: 500,
        description: String(cause),
      });
    } else if (!res) {
      res = createResponseFromRequest(req, {
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
