import { MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { EntityBaseService } from '@wener/server/entity/service';
import { AlpineRepoMetaEntity } from '@/alpine/entity/AlpineRepoMetaEntity';

@Injectable()
export class AlpineRepoMetaService extends EntityBaseService<AlpineRepoMetaEntity> {
	constructor(@Inject(MikroORM) protected readonly orm: MikroORM) {
		super(orm, AlpineRepoMetaEntity);
	}
}
