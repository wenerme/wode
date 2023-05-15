import { Controller, Get, Param } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { RegistryMetaStore } from './RegistryMetaStore';

@ApiTags('NPM')
@Controller(['npm/:pkg', 'npm/@:org/:pkg'])
export class RegistryController {
  constructor(private readonly meta: RegistryMetaStore) {}

  @Get()
  @ApiParam({
    name: 'org',
    required: false,
  })
  get(@Param('org') org: string, @Param('pkg') pkg: string) {
    if (org) {
      pkg = `@${org}/${pkg}`;
    }
    return this.meta.getPackageMeta(pkg).then((v) => v.meta);
  }
}
