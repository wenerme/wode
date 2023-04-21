import dayjs from 'dayjs';
import path from 'node:path';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { type PostgreSqlOptions } from '@mikro-orm/postgresql/PostgreSqlMikroORM';
import { type DynamicModule, type ModuleMetadata } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, type MercuriusDriverConfig } from '@nestjs/mercurius';
import { polyfillCrypto } from '@wener/utils/server';
import { getPackageDir } from '../util/getPackageDir';
import { ActuatorModule } from './actuator/actuator.module';
import { type DatabaseConfig, databaseConfig } from './config/database.config';
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
    const imports: ModuleMetadata['imports'] = [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: [`.env.${env}.local`, `.env.${env}`, `.env.local`, '.env'],
        load: [serverConfig, databaseConfig],
        cache: true,
      }),
    ];
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
    if (opts.db !== false) {
      imports.push(
        MikroOrmModule.forRootAsync({
          useFactory: (cs: ConfigService) => {
            const { dsn } = cs.get<DatabaseConfig>('database') || {};
            return createMikroOrmConfig({
              clientUrl: dsn,
              ...db,
            });
          },
          inject: [ConfigService],
        }),
      );
    }
    if (opts.actuator !== false) {
      imports.push(ActuatorModule);
    }

    const dynamicModule: DynamicModule = {
      imports,
      module: CoreModule,
      global: true,
      providers: [
        {
          provide: dayjs,
          useValue: getDayjs(),
        },
      ],
    };
    return dynamicModule;
  }
}
