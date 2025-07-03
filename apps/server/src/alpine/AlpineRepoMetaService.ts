import { MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { EntityBaseService } from '@wener/nestjs/entity/service';
import { AlpineRepoMetaEntity } from '@/alpine/entity/AlpineRepoMetaEntity';
import { AlpinePackageMetaEntity } from './entity/AlpinePackageMetaEntity';

@Injectable()
export class AlpineRepoMetaService extends EntityBaseService<AlpineRepoMetaEntity> {
	constructor(@Inject(MikroORM) protected readonly orm: MikroORM) {
		super(orm, AlpineRepoMetaEntity);
	}
}

@Injectable()
export class AlpinePackageMetaService extends EntityBaseService<AlpinePackageMetaEntity> {
	constructor(@Inject(MikroORM) protected readonly orm: MikroORM) {
		super(orm, AlpinePackageMetaEntity);
	}
}
