import { Module, ValidationPipe } from '@nestjs/common';
import { polyfillCrypto } from '@wener/utils/server';
import { runApplication } from '../../app/app.run';
import { CoreModule } from '../../app/core.module';
import { AlpineModule } from './alpine/alpine.module';
import { GithubModule } from './github/github.module';
import { HashController } from './hash/hash.controller';
import { ZxcvbnController } from './password/zxcvbn.controller';
import { RootResolver } from './root.resolver';
import { SemverController } from './semver/semver.controller';

const AppName = 'apis-server';

@Module({
  imports: [
    CoreModule.forRoot({
      name: AppName,
      db: false,
    }),
    GithubModule,
    AlpineModule,
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
