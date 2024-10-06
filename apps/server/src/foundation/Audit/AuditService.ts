import { MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AuditService {
  constructor(@Inject(MikroORM) protected readonly orm: MikroORM) {}
}
