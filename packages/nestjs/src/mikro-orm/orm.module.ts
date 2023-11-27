import { AnyEntity, MikroORM } from '@mikro-orm/core';
import { EntityName, MikroOrmModule, MikroOrmModuleFeatureOptions } from '@mikro-orm/nestjs';
import {
  type AbstractSqlConnection,
  EntityManager as SqlEntityManager,
  knex,
  MikroORM as PostgreSqlMikroORM,
  type Options as PostgreSqlOptions,
} from '@mikro-orm/postgresql';
import { ConfigurableModuleBuilder, DynamicModule, Logger, Module } from '@nestjs/common';
import { createLazyPromise } from '@wener/utils';
import { getMikroOrmConfig } from '../config';
import { createMikroOrmConfig } from './createMikroOrmConfig';

export type OrmModuleOptions = Partial<PostgreSqlOptions>;

const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<OrmModuleOptions>()
  .setExtras(
    {
      isGlobal: true,
    },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }),
  )
  .setClassMethodName('forRoot')
  .build();

export const ORM_MODULE_OPTIONS_TOKEN = MODULE_OPTIONS_TOKEN;

@Module({
  imports: [
    createLazyPromise(() =>
      // forRootAsync will create EntityManager immediately
      MikroOrmModule.forRootAsync({
        useFactory: (opts: OrmModuleOptions) => {
          let config = createMikroOrmConfig({
            entities: [],
            ...getMikroOrmConfig(),
            ...opts,
          }) as PostgreSqlOptions;
          // dedup
          config.entities = Array.from(new Set(config.entities));
          OrmModule.log.log(`Entities: ${config.entities?.map((v) => (v as any).name || v).join(', ')}`);
          return config;
        },
        inject: [MODULE_OPTIONS_TOKEN],
      }),
    ),
  ],
  providers: [
    {
      provide: SqlEntityManager,
      useFactory(orm: MikroORM) {
        return orm.em;
      },
      inject: [MikroORM],
    },
    {
      provide: PostgreSqlMikroORM,
      useExisting: MikroORM,
    },
    {
      provide: knex,
      useFactory(orm: MikroORM) {
        return (orm.em.getConnection() as AbstractSqlConnection).getKnex();
      },
      inject: [MikroORM],
    },
  ],
  exports: [SqlEntityManager, PostgreSqlMikroORM, knex, MODULE_OPTIONS_TOKEN],
})
export class OrmModule extends ConfigurableModuleClass {
  protected static readonly log = new Logger(OrmModule.name);

  static forFeature(
    options: EntityName<AnyEntity>[] | MikroOrmModuleFeatureOptions,
    contextName?: string,
  ): DynamicModule {
    return MikroOrmModule.forFeature(options, contextName);
  }
}
