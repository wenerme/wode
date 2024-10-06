import { Entity } from '@mikro-orm/core';
import { BaseTenantDictEntity } from '@/entity/BaseTenantDictEntity';

@Entity({ tableName: 'contact_method_type' })
export class ContactMethodType extends BaseTenantDictEntity {}
