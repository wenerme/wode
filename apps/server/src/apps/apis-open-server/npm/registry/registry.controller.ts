import { Controller, Get, Param } from '@nestjs/common';
import { RegistryMetaStore } from './RegistryMetaStore';

@Controller('npm/r')
export class RegistryController {
  constructor(private readonly meta: RegistryMetaStore) {}

  @Get(':pkg')
  get(@Param('pkg') pkg: string) {
    return this.meta.getPackageMeta(pkg).then((v) => v.meta);
  }

  @Get('@:org/:pkg')
  getOrg(@Param('org') org: string, @Param('pkg') pkg: string) {
    return this.meta.getPackageMeta(`@${org}/${pkg}`).then((v) => v.meta);
  }
}
