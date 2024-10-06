import { loadEnvs } from '@wener/nestjs';
import { App } from '@wener/nestjs/app';
import { patchMikroORMMetadataStorage } from '@wener/nestjs/entity';

patchMikroORMMetadataStorage();
process.env.APP_NAME = 'wode';
process.env.APP_COMPONENT = 'api-server';
await loadEnvs({ name: App.service });
const { runDemoApiServer: runServer } = await import('./runServer');
await runServer();
