import { Entity } from '@mikro-orm/decorators/legacy';
import { BaseTenantDictEntity } from '@/entity/BaseTenantDictEntity';

@Entity({ tableName: 'license_type' })
export class LicenseTypeEntity extends BaseTenantDictEntity {}
