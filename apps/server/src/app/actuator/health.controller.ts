import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Actuator')
@Controller('actuator/health')
export class HealthController {
  @Get('readiness')
  readiness() {
    return { status: 'UP' };
  }

  @Get('liveness')
  liveness() {
    return { status: 'UP' };
  }

  @Get()
  ping() {
    return { status: 'UP' };
  }
}
