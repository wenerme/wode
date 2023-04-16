import zxcvbn from 'zxcvbn';
import { Controller, Get, Query } from '@nestjs/common';

@Controller('password')
export class ZxcvbnController {
  @Get('zxcvbn')
  zxcvbn(@Query('password') password: string = '') {
    return zxcvbn(password);
  }
}
