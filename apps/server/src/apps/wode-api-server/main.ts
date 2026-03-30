import { loadEnvs } from '@wener/server';
import { App } from '@wener/server/app';
import { patchMikroORMMetadataStorage } from '@wener/server/entity';

patchMikroORMMetadataStorage();
process.env.APP_NAME = 'wode';
process.env.APP_COMPONENT = 'api-server';
await loadEnvs({ name: App.service });
const { runDemoApiServer: runServer } = await import('./runServer');
await runServer();
