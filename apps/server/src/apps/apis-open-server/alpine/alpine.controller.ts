import { Controller, Get } from '@nestjs/common';

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
