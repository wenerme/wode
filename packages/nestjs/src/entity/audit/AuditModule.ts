import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AuditLogEntity } from './AuditLogEntity';
import { AuditService } from './AuditService';

@Module({
  imports: [MikroOrmModule.forFeature(AuditModule.Entities)],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {
  static Entities = [AuditLogEntity];
}
