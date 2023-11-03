import { FastifyMulterModule } from '@nest-lab/fastify-multer';
import { Module } from '@nestjs/common';
import { OrmModule } from '@wener/nestjs/mikro-orm';
import { StorageItemEntity } from '../../entity/StorageItemEntity';
import { GetController } from './GetController';
import { StorageService } from './StorageService';

@Module({
  imports: [FastifyMulterModule, OrmModule.forFeature(WenerGetWebModule.Entities)],
  controllers: [GetController],
  providers: [StorageService],
})
export class WenerGetWebModule {
  static Entities = [StorageItemEntity];
}
