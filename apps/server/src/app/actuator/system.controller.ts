import { Controller, Get } from '@nestjs/common';
import { ms } from '@wener/utils';

@Controller('actuator')
export class SystemController {
  @Get('health/readiness')
  readiness() {
    return { status: 'UP' };
  }

  @Get('health/liveness')
  liveness() {
    return { status: 'UP' };
  }

  @Get('health')
  ping() {
    return { status: 'UP' };
  }

  @Get('summary')
  version() {
    const { NODE_ENV: env } = process.env;

    return {
      versions: process.versions,
      env,
      platform: process.platform,
      arch: process.arch,
      now: new Date(),
      uptime: ms(process.uptime() * 1000),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };
  }
}
