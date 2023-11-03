import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import zxcvbn from 'zxcvbn';

@ApiTags('Password')
@Controller('password')
export class ZxcvbnController {
  @Get('zxcvbn')
  @ApiOperation({
    summary: 'Check password by zxcvbn',
  })
  zxcvbn(@Query('password') password: string = '') {
    return zxcvbn(password);
  }

  @Get('zxcvbn/:password')
  @ApiOperation({
    summary: 'Check password by zxcvbn',
  })
  zxcvbnFromPath(@Param('password') password: string = '') {
    return zxcvbn(password);
  }
}
