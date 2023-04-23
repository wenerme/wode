import dayjs from 'dayjs';
import path from 'node:path';
import { EntityManager as CoreEntityManager, MikroORM as CoreMikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager, MikroORM, type Options as PostgreSqlOptions } from '@mikro-orm/postgresql';
import { type DynamicModule } from '@nestjs/common';
import { type Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, type MercuriusDriverConfig } from '@nestjs/mercurius';
import { getPackageDir } from '../util/getPackageDir';
import { ActuatorModule } from './actuator/actuator.module';
import { type DatabaseConfig, databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { serverConfig } from './config/server.config';
import { getDayjs } from './dayjs';
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
  static forRoot(opts: CoreModuleOptions): DynamicModule {
    // downside - large bundle
    const { name, db } = opts;
    const mod: Required<DynamicModule> = {
      global: true,
      controllers: [],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [`.env.${env}.local`, `.env.${env}`, `.env.local`, '.env'],
          load: [serverConfig, databaseConfig, redisConfig],
          cache: true,
        }),
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
    if (opts.graphql !== false) {
      imports.push(
        GraphQLModule.forRoot<MercuriusDriverConfig>({
          driver: MercuriusDriver,
          graphiql: true,
          autoSchemaFile: path.join(__dirname, `src/apps/${name}/schema.graphql`),
          sortSchema: true,
          subscription: true,
        }),
      );
    }
    //
    if (opts.db !== false) {
      imports.push(
        MikroOrmModule.forRootAsync({
          useFactory: (cs: ConfigService) => {
            const { dsn, debug } = cs.get<DatabaseConfig>('database') || {};
            return createMikroOrmConfig({
              clientUrl: dsn,
              debug,
              ...db,
            });
          },
          inject: [ConfigService],
        }),
      );
      // postgres
      providers.push({
        provide: EntityManager,
        useExisting: CoreEntityManager,
      });
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
