import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AuditLogEntity } from './AuditLogEntity';
import { AuditService } from './AuditService';

const auditEntities = [AuditLogEntity];

@Module({
	imports: [MikroOrmModule.forFeature(auditEntities)],
	providers: [AuditService],
	exports: [AuditService],
})
export class AuditModule {
	static Entities = auditEntities;
}
