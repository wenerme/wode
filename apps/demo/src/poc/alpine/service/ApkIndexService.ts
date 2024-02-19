import { MikroORM } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ApkIndexEntity } from '@src/poc/alpine/entity/ApkIndexEntity';
import { EntityBaseService } from '@wener/server/src/modules/entity/EntityBaseService';

@Injectable()
export class ApkIndexService extends EntityBaseService<ApkIndexEntity> {
  constructor(protected readonly orm: MikroORM) {
    super(orm, ApkIndexEntity);
  }
}
