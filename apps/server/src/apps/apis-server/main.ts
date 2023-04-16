import { Module, ValidationPipe } from '@nestjs/common';
import { polyfillCrypto } from '@wener/utils/server';
import { runApplication } from '../../app/app.run';
import { GithubModule } from './github/github.module';
import { HashController } from './hash/hash.controller';
import { ZxcvbnController } from './password/zxcvbn.controller';
import { SemverController } from './semver/semver.controller';

@Module({
  imports: [GithubModule],
  controllers: [HashController, ZxcvbnController, SemverController],
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
