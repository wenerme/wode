import { EntityManager, MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  type AbstractSqlConnection,
  EntityManager as SqlEntityManager,
  knex,
  MikroORM as PostgreSqlMikroORM,
  type Options as PostgreSqlOptions,
} from '@mikro-orm/postgresql';
import type { DynamicModule, Provider } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { createMikroOrmConfig } from './createMikroOrmConfig';

export type MikroOrmConfig = PostgreSqlOptions & Pick<Required<PostgreSqlOptions>, 'entities'>;
export const MikroOrmConfigToken = Symbol('MikroOrmConfigToken');

export class OrmModule {
  private static readonly log = new Logger(OrmModule.name);

  static forRoot({ config: _config }: { config: MikroOrmConfig }): DynamicModule {
    const mod: Required<DynamicModule> = {
      global: true,
      controllers: [],
      imports: [],
      module: OrmModule,
      providers: [] as Provider[],
      exports: [],
    };

    const { imports, providers, exports } = mod;

    providers.push({
      provide: MikroOrmConfigToken,
      useFactory: () => {
        const config = createMikroOrmConfig(_config) as MikroOrmConfig;
        // dedup
        config.entities = Array.from(new Set(config.entities));
        this.log.log(`Entities: ${config.entities.map((v) => (v as any).name || v).join(', ')}`);
        return config;
      },
      inject: [],
    });

    imports.push(
      MikroOrmModule.forRootAsync({
        useFactory(conf: MikroOrmConfig) {
          return conf;
        },
        inject: [MikroOrmConfigToken],
      }),
    );
    exports.push(MikroOrmConfigToken);

    // postgres
    providers.push(
      {
        provide: SqlEntityManager,
        useExisting: EntityManager,
      },
      {
        provide: knex,
        useFactory(orm: MikroORM) {
          return (orm.em.getConnection() as AbstractSqlConnection).getKnex();
        },
        inject: [MikroORM],
      },
    );
    exports.push(SqlEntityManager);

    providers.push({
      provide: PostgreSqlMikroORM,
      useExisting: MikroORM,
    });
    exports.push(PostgreSqlMikroORM);
    return mod;
  }
}
