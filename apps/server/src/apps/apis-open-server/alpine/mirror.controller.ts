import { Controller, Get } from '@nestjs/common';

@Controller('alpine/mirror')
export class MirrorController {
  @Get()
  list() {}
}
