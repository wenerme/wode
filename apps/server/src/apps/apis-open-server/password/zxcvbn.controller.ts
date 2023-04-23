import zxcvbn from 'zxcvbn';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('password')
@Controller('password')
export class ZxcvbnController {
  @Get('zxcvbn')
  zxcvbn(@Query('password') password: string = '') {
    return zxcvbn(password);
  }

  @Get('zxcvbn/:password')
  zxcvbnFromPath(@Param('password') password: string = '') {
    return zxcvbn(password);
  }
}
