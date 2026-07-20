import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AuditLogEntity } from './AuditLogEntity';
import { AuditService } from './AuditService';

const AuditModuleEntities = [AuditLogEntity];

@Module({
	imports: [MikroOrmModule.forFeature(AuditModuleEntities)],
	providers: [AuditService],
	exports: [AuditService],
})
export class AuditModule {
	static Entities = AuditModuleEntities;
}
