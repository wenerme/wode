import { type FastifyReply } from 'fastify';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from '../../app/auth';
import { HttpRequestLog } from './HttpRequestLog';

@ApiTags('FetchCache')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('fetch-cache/request')
export class RequestController {
  constructor(@InjectRepository(HttpRequestLog) private readonly repo: EntityRepository<HttpRequestLog>) {}

  @Roles(Role.Admin)
  @Get(':requestId')
  async get(@Res() res: FastifyReply, @Param('requestId') requestId: string) {
    const { repo } = this;
    const e = await repo.findOneOrFail(requestId);

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
