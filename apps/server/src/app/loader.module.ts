import { DynamicModule, Logger } from '@nestjs/common';
import { MaybePromise } from '@wener/utils';

export class ModuleLoader {
  static log = new Logger(ModuleLoader.name);

  static forRoot({
    modules,
    loader,
  }: {
    modules: Array<string>;
    loader: (name: string) => MaybePromise<{ Module: DynamicModule }>;
  }): DynamicModule {
    const { log } = this;
    const mod: DynamicModule = {
      module: ModuleLoader,
    };
    mod.imports = modules.map((name) => {
      log.log(`Loading ${name}`);
      return Promise.resolve(loader(name)).then((v) => v.Module);
    });
    return mod;
  }
}
