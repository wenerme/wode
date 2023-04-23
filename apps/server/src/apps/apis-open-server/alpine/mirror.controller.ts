import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Alpine')
@Controller('alpine/mirror')
export class MirrorController {
  @Get()
  list() {}
}
