import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Alpine')
@Controller('alpine')
export class AlpineController {
  @Get('version')
  version() {
    return {};
  }

  @Get('latest')
  versionTxt() {
    return 'v3.17.2';
  }
}
