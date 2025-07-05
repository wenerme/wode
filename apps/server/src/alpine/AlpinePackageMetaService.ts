import { MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { EntityBaseService } from '@wener/nestjs/entity/service';
import { AlpinePackageMetaEntity } from '@/alpine/entity/AlpinePackageMetaEntity';

@Injectable()
export class AlpinePackageMetaService extends EntityBaseService<AlpinePackageMetaEntity> {
	constructor(@Inject(MikroORM) protected readonly orm: MikroORM) {
		super(orm, AlpinePackageMetaEntity);
	}
}
