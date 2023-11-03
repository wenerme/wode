import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { firstOfMaybeArray } from '@wener/utils';
import { type FastifyRequest } from 'fastify';

@ApiTags('Misc')
@Controller()
export class IpController {
  @Get('ip')
  get(@Req() req: FastifyRequest) {
    const ip = req.headers['x-forwarded-for'] || req.headers['cf-connecting-ip'] || req.connection.remoteAddress;
    return firstOfMaybeArray(ip)?.split(',')?.[0].trim();
  }
}
