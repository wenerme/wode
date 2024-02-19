import { MikroORM } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EntityBaseService } from '../../../entity/service/EntityBaseService';
import { ApkIndexEntity } from '../entity/ApkIndexEntity';

@Injectable()
export class ApkIndexService extends EntityBaseService<ApkIndexEntity> {
  constructor(protected readonly orm: MikroORM) {
    super(orm, ApkIndexEntity);
  }
}
