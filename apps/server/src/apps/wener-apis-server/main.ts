import { loadEnvs } from '@wener/nestjs';
import { App } from '@wener/nestjs/app';
import { patchMikroORMMetadataStorage } from '@wener/nestjs/entity';

patchMikroORMMetadataStorage();
process.env.APP_NAME = 'wener-apis';
process.env.APP_COMPONENT = 'server';
await loadEnvs({ name: App.service });
const { runWenerApisServer: runServer } = await import('./runWenerApisServer');
await runServer();
