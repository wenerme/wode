import { Entity } from '@mikro-orm/core';
import { TenantBaseEntity } from './TenantBaseEntity';

@Entity({ abstract: true })
export abstract class SystemBaseEntity<E extends SystemBaseEntity<any>> extends TenantBaseEntity<E> {}
