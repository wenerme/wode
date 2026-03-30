import 'reflect-metadata';
import { loadEnvs } from '@wener/server';
import { App } from '@wener/server/app';
import { patchMikroORMMetadataStorage } from '@wener/server/entity';

patchMikroORMMetadataStorage();

process.env.APP_NAME = 'wode';
process.env.APP_COMPONENT = 'service-agent';

await loadEnvs({ name: App.service });
const { runServiceAgent: runServer } = await import('./runServiceAgent');
await runServer();
