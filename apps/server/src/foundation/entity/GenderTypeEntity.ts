import { Entity } from '@mikro-orm/core';
import { BaseTenantDictEntity } from '@/entity/BaseTenantDictEntity';

@Entity({ tableName: 'gender_type' })
export class GenderTypeEntity extends BaseTenantDictEntity {}
