import { EntityManager as CoreEntityManager, MikroORM as CoreMikroORM, type AnyEntity } from '@mikro-orm/core';
import { MikroOrmModule, type EntityName, type MikroOrmModuleFeatureOptions } from '@mikro-orm/nestjs';
import type { MikroOrmModuleAsyncOptions } from '@mikro-orm/nestjs/typings';
import {
  knex,
  EntityManager as PostgreSqlEntityManager,
  MikroORM as PostgreSqlMikroORM,
  type AbstractSqlConnection,
  type Options,
} from '@mikro-orm/postgresql';
import { Logger, type DynamicModule } from '@nestjs/common';
import { createLazyPromise, type MaybePromise } from '@wener/utils';
import { getMikroOrmConfig } from '../config';
import { defineMikroOrmOptions } from './defineMikroOrmOptions';

export type OrmModuleOptions = Partial<Options> & {
  onConfig?: (config: Options) => void;
};

export class OrmModule {
  protected static readonly log = new Logger(OrmModule.name);

  static forRootAsync(
    opts: Omit<MikroOrmModuleAsyncOptions, 'useExisting' | 'useClass'> & {
      onConfig?: (config: Options, ...args: any[]) => MaybePromise<void>;
    },
  ) {
    return createLazyPromise(async () => {
      const { onConfig, useFactory, ...rest } = opts;

      let module = MikroOrmModule.forRootAsync({
        ...rest,
        useFactory: async (...args) => {
          let config = ((await useFactory?.(...args)) ||
            defineMikroOrmOptions({
              entities: [],
              ...getMikroOrmConfig(),
            })) as Options;
          // dedup
          config.entities = Array.from(new Set(config.entities)).filter(Boolean);
          await onConfig?.(config, ...args);
          return config;
        },
      });

      setup(module);
      return module;
    });
  }

  static forRoot(opts: OrmModuleOptions) {
    return this.forRootAsync({
      onConfig: opts.onConfig,
      useFactory: () => defineMikroOrmOptions(opts),
    });
  }

  static forFeature(
    options: EntityName<AnyEntity>[] | MikroOrmModuleFeatureOptions,
    contextName?: string,
  ): DynamicModule {
    return MikroOrmModule.forFeature(options, contextName);
  }
}

function setup(module: DynamicModule) {
  // const module = (dm.imports?.[0] || dm) as DynamicModule;
  module.global ??= true;
  module.exports ||= [];
  module.providers ||= [];
  module.providers.push(
    {
      provide: knex,
      useFactory(orm: CoreMikroORM) {
        return (orm.em.getConnection() as AbstractSqlConnection).getKnex();
      },
      inject: [CoreMikroORM],
    },
    {
      provide: PostgreSqlMikroORM,
      useExisting: CoreMikroORM,
    },
    {
      provide: PostgreSqlEntityManager,
      useExisting: CoreEntityManager,
    },
  );
  module.exports.push(PostgreSqlMikroORM, PostgreSqlEntityManager, knex);
}
