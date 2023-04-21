import { Controller, Get } from '@nestjs/common';

@Controller('alpine/pkg')
export class PackageController {
  @Get()
  list() {}

  @Get('/-/flagged')
  getFlagged() {}

  @Get(':pkg')
  getPkg() {}

  @Get(':arch/:repo/:pkg/:version')
  getVersion() {}
}
