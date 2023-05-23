import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth';

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
  @Public()
  health() {
    return { status: 'UP' };
  }
}
