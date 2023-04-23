import { type FastifyRequest } from 'fastify';
import { All, Body, Controller, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Cookies } from '../../../app/decorator';

@ApiTags('Misc')
@Controller('whoami')
export class WhoamiController {
  @All()
  whoami(@Req() req: FastifyRequest, @Body() body: any, @Cookies() cookies: any) {
    return {
      method: req.method,
      query: req.query,
      cookies,
      body,
      headers: req.headers,
    };
  }
}
