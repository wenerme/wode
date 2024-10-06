import { Logger } from '@nestjs/common';
import type { Msg, NatsError } from 'nats';
import {
  createResponseFromRequest,
  ServiceRequestPayloadSchema,
  ServiceResponsePayloadSchema,
  type ServerRequest,
  type ServerResponse,
  type ServiceRegistry,
} from '../../service';
import { createMsgHdrFromResponse } from './createMsgHdrFromResponse';
import { createResponseFromMessageHeader } from './createResponseFromMessageHeader';
import type { KnownNatsServerMetadata } from './types';

export async function handleNatsServiceRequest({
  msg,
  registry: svc,
  logger: log = new Logger(`NatsServiceServerHandler`),
  err,
}: {
  msg: Msg;
  registry: ServiceRegistry;
  logger?: Logger;
  err?: NatsError | null;
}) {
  if (err) {
    log.error(String(err));
    return;
  }
  if (!msg.reply) {
    log.log(`No reply subject: ${msg.subject}`);
    return;
  }

  let res: ServerResponse | undefined;
  let cause: any | undefined;
  let req: ServerRequest;
  try {
    log.debug(`<- ${msg.subject}`);
    req = Object.assign({ metadata: {} }, ServiceRequestPayloadSchema.parse(JSON.parse(msg.string())));
    createResponseFromMessageHeader(req, msg.headers);
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
      process.env.NODE_ENV === 'development' && console.error(cause);
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
  const hdr = createMsgHdrFromResponse(res);
  msg.respond(JSON.stringify(write), {
    headers: hdr,
  });
}
