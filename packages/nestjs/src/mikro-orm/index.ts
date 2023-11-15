import 'reflect-metadata';

export { MinimalBaseEntity, type MinimalBaseEntityOptionalFields } from './entity/MinimalBaseEntity';
export { EnumBaseEntity } from './entity/EnumBaseEntity';
export { ResourceBaseEntity } from './entity/ResourceBaseEntity';
export { TenantBaseEntity, type TenantBaseOptionalEntityFields } from './entity/TenantBaseEntity';

export { getMikroORM, getEntityManager, runInTransaction, requireContextEntityManager } from './context';
export { OrmModule, type OrmModuleOptions, ORM_MODULE_OPTIONS_TOKEN } from './orm.module';
