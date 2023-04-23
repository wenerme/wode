import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from '../auth';

@ApiTags('Actuator')
@ApiBearerAuth()
@Roles(Role.SystemAdmin)
@Controller('actuator/env')
export class EnvController {
  @Get()
  getEnv() {
    return process.env;
  }
}
