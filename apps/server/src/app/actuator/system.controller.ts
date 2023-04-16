import { Controller, Get } from '@nestjs/common';

@Controller('system')
export class SystemController {
  @Get('ping')
  ping() {
    return 'pong';
  }

  @Get('env')
  env() {
    const { NODE_ENV: env } = process.env;
    return {
      versions: process.versions,
      env,
      now: new Date(),
    };
  }
}
