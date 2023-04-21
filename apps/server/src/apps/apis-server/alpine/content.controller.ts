import { Controller, Get } from '@nestjs/common';

@Controller('alpine/content')
export class ContentController {
  @Get(':arch/:repo/:pkg/:version/:filepath*')
  getContent() {}
}
