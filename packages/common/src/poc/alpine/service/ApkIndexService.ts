import { MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { EntityBaseService } from '@/entity/service/EntityBaseService';
import { ApkIndexEntity } from '../entity/ApkIndexEntity';

@Injectable()
export class ApkIndexService extends EntityBaseService<ApkIndexEntity> {
  constructor(@Inject(MikroORM) protected readonly orm: MikroORM) {
    super(orm, ApkIndexEntity);
  }
}
