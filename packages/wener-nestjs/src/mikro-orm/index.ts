import 'reflect-metadata';

export { MinimalBaseEntity, type MinimalBaseEntityOptionalFields } from './entity/MinimalBaseEntity';
export { MinimalEnumBaseEntity } from './entity/MinimalEnumBaseEntity';
export { MinimalResourceBaseEntity } from './entity/MinimalResourceBaseEntity';
export { MinimalTenantBaseEntity } from './entity/MinimalTenantBaseEntity';

export { getMikroORM, getEntityManager, runInTransaction, requireContextEntityManager } from './context';
export { OrmModule, type OrmModuleOptions } from './OrmModule';

export { defineMikroOrmOptions } from './defineMikroOrmOptions';
