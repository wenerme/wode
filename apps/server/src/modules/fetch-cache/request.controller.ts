import { type FastifyReply, type FastifyRequest } from 'fastify';
import { once } from 'node:events';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from '../../app/auth';
import { HttpRequestLog } from './HttpRequestLog';
import { SSE } from './SSE';

@ApiTags('FetchCache')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('fetch-cache/request')
export class RequestController {
  constructor(@InjectRepository(HttpRequestLog) private readonly repo: EntityRepository<HttpRequestLog>) {}

  @Roles(Role.Admin)
  @Get(':requestId')
  async get(@Res() res: FastifyReply, @Req() req: FastifyRequest, @Param('requestId') requestId: string) {
    const { repo } = this;
    const e = await repo.findOneOrFail(requestId);
    const ac = new AbortController();
    abortForSocket(ac, req);
    res.status(e.statusCode);

    switch (e.contentType) {
      case 'text/event-stream': {
        res.headers({
          'Content-Type': 'text/event-stream',
          Connection: 'keep-alive',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0, no-transform',
          Pragma: 'no-cache',
          Expire: '0',
          'X-Accel-Buffering': 'no',
          Date: (new Date() as any).toGMTString(),
          'Transfer-Encoding': 'chunked',
          'X-No-Compression': '1',
        });
        const raw = res.raw;
        raw.flushHeaders();
        for (const event of e.responsePayload) {
          raw.write(SSE.stringify(event));
        }
        raw.end();
        return;
      }
    }

    if (e.responseBody) {
      res.headers(e.responseHeaders);
      res.send(e.responseBody);
    } else if (e.responsePayload) {
      const { 'content-encoding': _, ...headers } = e.responseHeaders;
      res.headers(headers);
      res.send(e.responsePayload);
    } else {
      res.headers(e.responseHeaders);
      res.send();
    }
  }
}

function abortForSocket(ac: AbortController, req: FastifyRequest) {
  // https://github.com/metcoder95/fastify-racing
  Promise.resolve()
    .then(async () => {
      await once(req.raw.socket, 'close');
    })
    .finally(() => {
      ac.abort();
    });
}
