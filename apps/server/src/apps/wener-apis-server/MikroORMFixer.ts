import { EntityManager, MikroORM } from '@mikro-orm/core';
import { EntityManager as PostgreSqlEntityManager, MikroORM as PostgreSqlMikroORM } from '@mikro-orm/postgresql';
import type { DynamicModule } from '@nestjs/common';

class MikroORMFix {}

// fixme the compiled PostgreSqlMikroORM is different from the dev
export const MikroORMFixer: DynamicModule = {
  module: MikroORMFix,
  global: true,
  exports: [PostgreSqlMikroORM, PostgreSqlEntityManager],
  providers: [
    {
      provide: PostgreSqlMikroORM,
      useFactory: (v) => {
        return v;
      },
      inject: [MikroORM],
    },
    {
      provide: PostgreSqlEntityManager,
      useFactory: (v) => {
        return v;
      },
      inject: [EntityManager],
    },
  ],
};
