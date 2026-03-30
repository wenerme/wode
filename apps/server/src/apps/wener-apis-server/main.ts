import { loadEnvs } from '@wener/server';
import { App } from '@wener/server/app';
import { patchMikroORMMetadataStorage } from '@wener/server/entity';

patchMikroORMMetadataStorage();
process.env.APP_NAME = 'wener-apis';
process.env.APP_COMPONENT = 'server';
await loadEnvs({ name: App.service });
const { runWenerApisServer: runServer } = await import('./runWenerApisServer');
await runServer();
