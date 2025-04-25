import { loadEnvs } from '@wener/nestjs';
import { App } from '@wener/nestjs/app';
import { patchMikroORMMetadataStorage } from '@wener/nestjs/entity';

patchMikroORMMetadataStorage();
process.env.APP_NAME = 'wener';
process.env.APP_COMPONENT = 'lab-server';
await loadEnvs({ name: App.service });
const { runLabServer: runServer } = await import('./runLabServer');
await runServer();
