import path from 'node:path';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, type MercuriusDriverConfig } from '@nestjs/mercurius';
import { polyfillCrypto } from '@wener/utils/server';
import { ActuatorModule } from '../../app/actuator/actuator.module';
import { runApplication } from '../../app/app.run';
import { GithubModule } from './github/github.module';
import { HashController } from './hash/hash.controller';
import { ZxcvbnController } from './password/zxcvbn.controller';
import { RootResolver } from './root.resolver';
import { SemverController } from './semver/semver.controller';

const AppName = 'apis-server';

const { NODE_ENV: env = 'production' } = process.env;
const __dirname = process.cwd();

export const serverConfig = registerAs('server', () => ({
  port: process.env.PORT || 3000,
}));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${env}.local`, `.env.${env}`, `.env.local`, '.env'],
      load: [serverConfig],
      cache: true,
    }),
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      graphiql: true,
      autoSchemaFile: path.join(__dirname, `src/apps/${AppName}/schema.graphql`),
      sortSchema: true,
      subscription: true,
    }),
    GithubModule,
    ActuatorModule,

    // RouterModule.register([
    //   {
    //     path: 'actuator',
    //     module: ActuatorModule,
    //   },
    // ]),
  ],

  controllers: [HashController, ZxcvbnController, SemverController],
  providers: [RootResolver],
})
class ApisServerModule {}

await polyfillCrypto();
const app = await runApplication({
  name: 'apis-server',
  module: ApisServerModule,
  onInit: (app) => {
    app.useGlobalPipes(new ValidationPipe());
  },
});
