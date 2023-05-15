import { Module } from '@nestjs/common';
import { LocalRepoService } from './LocalRepoService';
import { AlpineController } from './alpine.controller';
import { ContentController } from './content/content.controller';
import { MirrorController } from './mirror/mirror.controller';
import { PackageController } from './package/package.controller';

@Module({
  controllers: [PackageController, MirrorController, ContentController, AlpineController],
  providers: [LocalRepoService],
})
export class AlpineModule {}
