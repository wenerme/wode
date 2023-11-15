import { Entity } from '@mikro-orm/core';
import { WodeTenantBaseEntity } from './WodeTenantBaseEntity';

@Entity({ abstract: true })
export abstract class SystemBaseEntity<E extends SystemBaseEntity<any>> extends WodeTenantBaseEntity<E> {}
