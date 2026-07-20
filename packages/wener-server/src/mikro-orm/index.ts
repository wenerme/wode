import 'reflect-metadata';

export { getEntityManager, getMikroORM, requireContextEntityManager, runInTransaction, setMikroORM } from './context';
export { createSqliteDialect } from './createSqliteDialect';
export { defineMikroOrmOptions } from './defineMikroOrmOptions';
export { MinimalBaseEntity, type MinimalBaseEntityOptionalFields } from './entity/MinimalBaseEntity';
export { MinimalEnumBaseEntity } from './entity/MinimalEnumBaseEntity';
export { MinimalResourceBaseEntity } from './entity/MinimalResourceBaseEntity';
export { MinimalTenantBaseEntity } from './entity/MinimalTenantBaseEntity';
export { OrmModule, type OrmModuleOptions } from './OrmModule';
