import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ms } from '@wener/utils';
import { Role, Roles } from '../auth';

@ApiTags('Actuator')
@ApiBearerAuth()
@Roles(Role.SystemAdmin)
@Controller('actuator')
export class ProcessController {
  @Get('process')
  @ApiOperation({
    summary: 'Process status',
  })
  process() {
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
