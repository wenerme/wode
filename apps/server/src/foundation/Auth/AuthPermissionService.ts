import { MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { AuthPermissionEntity } from '@/foundation/Auth/entity';
import { CustomBaseEntityService } from '@/foundation/services/CustomBaseEntityService';

@Injectable()
export class AuthPermissionService extends CustomBaseEntityService<AuthPermissionEntity> {
  constructor(@Inject(MikroORM) orm: MikroORM) {
    super(orm, AuthPermissionEntity);
  }
}
