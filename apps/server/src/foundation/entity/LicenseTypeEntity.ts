import { Entity } from '@mikro-orm/core';
import { BaseTenantDictEntity } from '@/entity/BaseTenantDictEntity';

@Entity({ tableName: 'license_type' })
export class LicenseTypeEntity extends BaseTenantDictEntity {}
