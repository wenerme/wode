import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Controller, Delete, Get, Inject, Logger, Post, Req, Res } from '@nestjs/common';
import { ApiHeaders } from '@nestjs/swagger';
import { FetchLike } from '@wener/utils';
import { createFetchWithProxy } from '@wener/utils/server';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { HttpRequestLogEntity } from '../../entity/HttpRequestLogEntity';
import { createFetchWithCache } from '../../modules/FetchCache';

const isDev = process.env.NODE_ENV === 'development';

@Controller()
@ApiHeaders([
  { name: 'OpenAI-Organization', example: 'YOUR_ORG_ID' },
  { name: 'Authorization', example: 'Bearer sk-' },
])
export class SimpleProxyController {
  private readonly fetch: FetchLike;
  private readonly log = new Logger(this.constructor.name);

  constructor(
    @Inject(EntityManager) private em: EntityManager,
    @InjectRepository(HttpRequestLogEntity) private repo: EntityRepository<HttpRequestLogEntity>,
  ) {
    let fetch = createFetchWithProxy({
      proxy: process.env.FETCH_PROXY,
    });
    fetch = createFetchWithCache({
      fetch,
      repo,
      config: {
        use: 'request',
        // use: 'skip',
        expires: '5m',
      },
    });
    this.fetch = fetch;
  }

  @Get('/v1/*')
  async get(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this._proxy(req, res);
  }

  @Post('/v1/*')
  // async post(@Req() req: FastifyRequest, @Res() res: RawBodyRequest<FastifyRequest>) {
  async post(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this._proxy(req, res);
  }

  @Delete('/v1/*')
  async delete(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this._proxy(req, res);
  }

  async _proxy(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    let url = new URL(`/v1/${(req as any).params['*']}`, 'https://api.openai.com');
    const { method } = req;
    const up: Record<string, any> = Object.fromEntries(Object.entries(req.headers));
    let body = req.body as any;

    this.log.log(`Proxy ${method} ${url}`);
    if (isDev) {
      console.log(`-> ${method} ${url}\n`, up, '\n---\n', body);
    }

    let headers: Record<string, string> = {
      authorization: up.authorization,
      'content-type': up['content-type'],
      'openai-organization': up['openai-organization'],
      'x-openai-organization': up['x-openai-organization'],
    };
    // rm falsy headers
    headers = Object.fromEntries(Object.entries(headers).filter(([_, v]) => v));
    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
    }

    let init: RequestInit = {
      method,
      headers: headers,
      body,
    };
    const r = await this.fetch(url.toString(), init);

    if (isDev) {
      console.log(`<- ${r.status} ${r.statusText}\n`, Object.fromEntries(r.headers.entries()));
    }

    // openai-
    // x-ratelimit
    let down = {
      ...Object.fromEntries(
        Array.from(r.headers.entries()).filter(([k]) => {
          switch (k) {
            case 'content-type':
            case 'x-request-id':
              return true;
          }
          // if (k.startsWith('cf-') || k.startsWith('alt-')) {
          //   return false;
          // }
          // switch (k) {
          //   case 'set-cookie':
          //   case 'content-length':
          //     return false;
          //   default:
          //     return true;
          // }
        }),
      ),
      'cache-control': 'no-cache, must-revalidate',
    };

    let raw = res.raw;
    raw.writeHead(r.status, down);
    for await (const value of asyncIteratorOf(r.body!)) {
      raw.write(value);
    }

    raw.end();
  }
}

function asyncIteratorOf<T = any>(
  rs: ReadableStream,
): {
  [Symbol.asyncIterator](): AsyncIterableIterator<T>;
} {
  return {
    async *[Symbol.asyncIterator]() {
      const reader = rs.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}
