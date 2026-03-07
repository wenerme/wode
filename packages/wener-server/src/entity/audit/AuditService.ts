import type { MikroORM } from '@mikro-orm/postgresql';

export class AuditService {
	orm!: MikroORM;
}
