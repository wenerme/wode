import dayjs from 'dayjs';
import path from 'node:path';
import { EntityManager as CoreEntityManager, MikroORM as CoreMikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  type AbstractSqlConnection,
  EntityManager,
  knex,
  MikroORM,
  type Options as PostgreSqlOptions,
} from '@mikro-orm/postgresql';
import { type DynamicModule, Logger, type Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, type MercuriusDriverConfig } from '@nestjs/mercurius';
import { getPackageDir } from '../util/getPackageDir';
import { ActuatorModule } from './actuator/actuator.module';
import { type DatabaseConfig, databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { serverConfig } from './config/server.config';
import { getDayjs } from './dayjs';
import { HookManager, HookModule, type MikroOrmConfig } from './hook.module';
import { createMikroOrmConfig } from './mikro-orm/createMikroOrmConfig';

const __dirname = getPackageDir() || process.cwd();

const { NODE_ENV: env = 'production' } = process.env;

export interface CoreModuleOptions {
  name: string;
  db?: false | PostgreSqlOptions;
  graphql?: false;
  actuator?: false;
}

export class CoreModule {
  private static readonly log = new Logger(CoreModule.name);

  static forRoot(opts: CoreModuleOptions): DynamicModule {
    // downside - large bundle
    const { name, db } = opts;
    const mod: Required<DynamicModule> = {
      global: true,
      controllers: [],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [`.env.${name}.local`, `.env.${name}`, `.env.${env}.local`, `.env.${env}`, `.env.local`, '.env'],
          load: [serverConfig, databaseConfig, redisConfig],
          cache: true,
        }),
        HookModule,
      ],
      module: CoreModule,
      providers: [
        {
          provide: dayjs,
          useValue: getDayjs(),
        },
      ] as Provider[],
      exports: [dayjs],
    };
    const { imports, providers, exports } = mod;
    // if (opts.graphql !== false) {
    //   imports.push(
    //     GraphQLModule.forRoot<MercuriusDriverConfig>({
    //       driver: MercuriusDriver,
    //       graphiql: true,
    //       autoSchemaFile: path.join(__dirname, `src/apps/${name}/schema.graphql`),
    //       sortSchema: true,
    //       subscription: true,
    //     }),
    //   );
    // }
    //
    if (opts.db !== false) {
      imports.push(
        MikroOrmModule.forRootAsync({
          useFactory: (cs: ConfigService, hm: HookManager) => {
            const { dsn, debug } = cs.get<DatabaseConfig>('database') || {};
            let config = createMikroOrmConfig({
              clientUrl: dsn,
              debug,
              entities: [],
              ...db,
            }) as MikroOrmConfig;
            config = hm.onMikroOrmConfig(config);
            this.log.log(`Entities: ${config.entities.map((v) => (v as any).name || v).join(', ')}`);
            return config;
          },
          inject: [ConfigService, HookManager],
        }),
      );
      // postgres
      providers.push(
        {
          provide: EntityManager,
          useExisting: CoreEntityManager,
        },
        {
          provide: knex,
          useFactory: (orm: CoreMikroORM) => {
            return (orm.em.getConnection() as AbstractSqlConnection).getKnex();
          },
          inject: [CoreMikroORM],
        },
      );
      exports.push(EntityManager);

      providers.push({
        provide: MikroORM,
        useExisting: CoreMikroORM,
      });
      exports.push(MikroORM);
    }
    //
    if (opts.actuator !== false) {
      imports.push(ActuatorModule);
    }

    return mod;
  }
}
