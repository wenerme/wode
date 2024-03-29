import { EntityManager } from '@mikro-orm/core';
import { Global, Module } from '@nestjs/common';
import { createHookToken, HookService, MikroOrmConfig } from '../../../../app/modules/hook/hook.module';
import { RegistryMetaStore } from './registry/RegistryMetaStore';
import { PackageMeta } from './registry/entity/PackageMeta';
import { RegistryController } from './registry/registry.controller';

class NpmModuleHook implements HookService {
  onMikroOrmConfig = (o: MikroOrmConfig) => {
    o.entities.push(PackageMeta);
  };
}

@Module({
  providers: [
    {
      provide: createHookToken('npm'),
      useClass: NpmModuleHook,
    },
  ],
  exports: [createHookToken('npm')],
})
@Global()
class NpmModuleHookModule {}

@Module({
  imports: [NpmModuleHookModule],
  controllers: [RegistryController],
  providers: [
    {
      provide: RegistryMetaStore,
      useFactory: async (em) => {
        // it's hard to maintain multi MikroORM instance, not works as expected
        // const { defineConfig, MikroORM } = await import('@mikro-orm/better-sqlite');
        // const config = defineConfig({
        //   // ...getDefaultMikroOrmOptions(),
        //   name: 'NPM',
        //   entities: [PackageMeta],
        //   clientUrl: `file:npm.sqlite?journal_mode=WAL`,
        //   // file:npm.sqlite?journal_mode=WAL
        //   dbName: 'npm.sqlite',
        //   schemaGenerator: {
        //     disableForeignKeys: true,
        //     createForeignKeyConstraints: true,
        //     ignoreSchema: [],
        //   },
        //   debug: process.env.NODE_ENV === 'development',
        // });
        //
        // const orm = new MikroORM(config);
        // await orm.connect();
        // if (!orm.em) {
        //   throw new Error(`No EntityManager`);
        // }
        // await orm.discoverEntity(PackageMeta);
        // if (!orm.getMetadata()) {
        //   throw new Error(`No metadata`);
        // }
        // // await orm.migrator.up();
        // console.log(`NPM Schema`, await orm.getSchemaGenerator().getCreateSchemaSQL());
        // await orm.getSchemaGenerator().updateSchema({});
        return new RegistryMetaStore({
          // em: orm.em,
          em,
        });
      },
      inject: [EntityManager],
    },
  ],
})
export class NpmModule {}
