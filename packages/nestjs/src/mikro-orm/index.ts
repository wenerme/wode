import 'reflect-metadata';

export { MinimalBaseEntity, type MinimalBaseOptionalEntityFields } from './entity/MinimalBaseEntity';
export { EnumBaseEntity } from './entity/EnumBaseEntity';
export { ResourceBaseEntity, type ResourceBaseOptionalEntityFields } from './entity/ResourceBaseEntity';
export { TenantBaseEntity, type TenantBaseOptionalEntityFields } from './entity/TenantBaseEntity';

export { getMikroORM, getEntityManager, runInTransaction, requireContextEntityManager } from './context';
export { OrmModule, type OrmModuleOptions, ORM_MODULE_OPTIONS_TOKEN } from './orm.module';
