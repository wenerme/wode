import { AnyEntity, MikroORM as CoreMikroORM, EntityManager as CoreEntityManager } from '@mikro-orm/core';
import { EntityName, MikroOrmModule, MikroOrmModuleFeatureOptions, MIKRO_ORM_MODULE_OPTIONS } from '@mikro-orm/nestjs';
import type { MikroOrmModuleAsyncOptions } from '@mikro-orm/nestjs/typings';
import {
  type AbstractSqlConnection,
  knex,
  MikroORM as PostgreSqlMikroORM,
  EntityManager as PostgreSqlEntityManager,
  type Options,
} from '@mikro-orm/postgresql';
import { DynamicModule, Logger } from '@nestjs/common';
import { createLazyPromise, MaybePromise } from '@wener/utils';
import { getMikroOrmConfig } from '../config';
import { createMikroOrmConfig } from './createMikroOrmConfig';

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
    return createLazyPromise(() => {
      const { onConfig, useFactory, ...rest } = opts;

      let module = MikroOrmModule.forRootAsync({
        ...rest,
        useFactory: async (...args) => {
          let config = ((await useFactory?.(...args)) ||
            createMikroOrmConfig({
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
    return createLazyPromise(() => {
      const { onConfig, ...rest } = opts;

      // forRootAsync will create EntityManager immediately
      let module = MikroOrmModule.forRootAsync({
        useFactory: () => {
          let config = createMikroOrmConfig({
            entities: [],
            ...getMikroOrmConfig(),
            ...rest,
          }) as Options;
          // dedup
          config.entities = Array.from(new Set(config.entities)).filter(Boolean);
          onConfig?.(config);
          return config;
        },
        inject: [],
      });

      setup(module);
      return module;
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
