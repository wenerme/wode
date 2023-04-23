import { Controller, Get } from '@nestjs/common';

@Controller('actuator/health')
export class HealthController {
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
}
