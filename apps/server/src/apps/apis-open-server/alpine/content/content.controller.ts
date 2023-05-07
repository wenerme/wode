import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Alpine')
@Controller('alpine/content')
export class ContentController {
  @Get(':arch/:repo/:pkg/:version/*')
  getContent() {}
}
