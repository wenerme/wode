import { Entity } from '@mikro-orm/decorators/legacy';
import { BaseTenantDictEntity } from '@/entity/BaseTenantDictEntity';

@Entity({ tableName: 'gender_type' })
export class GenderTypeEntity extends BaseTenantDictEntity {}
