import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth';
import { hideActuatorApi } from './const';

@ApiTags('Actuator')
@Controller('actuator/health')
@ApiExcludeController(hideActuatorApi())
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
