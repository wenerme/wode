import 'reflect-metadata';
import { loadEnvs } from '@wener/nestjs';
import { App } from '@wener/nestjs/app';
import { patchMikroORMMetadataStorage } from '@wener/nestjs/entity';

patchMikroORMMetadataStorage();

process.env.APP_NAME = 'wode';
process.env.APP_COMPONENT = 'service-agent';

await loadEnvs({ name: App.service });
const { runServiceAgent: runServer } = await import('./runServiceAgent');
await runServer();
