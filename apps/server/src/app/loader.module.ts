import { Logger, type DynamicModule, type Type } from '@nestjs/common';
import { type MaybePromise } from '@wener/utils';

export class ModuleLoader {
  static log = new Logger(ModuleLoader.name);

  static forRoot({
    modules,
    loader,
  }: {
    modules: Array<string | MaybePromise<IModule>>;
    loader: (name: string) => MaybePromise<IModule>;
  }): DynamicModule {
    const { log } = this;
    const mod: DynamicModule = {
      module: ModuleLoader,
    };
    mod.imports = modules.map((modOrName) => {
      let mod: Promise<IModule>;
      let name: string = '';
      if (typeof modOrName !== 'string') {
        mod = Promise.resolve(modOrName);
      } else {
        name = modOrName;
        mod = Promise.resolve(loader(modOrName));
      }

      log.log(`Loading ${name}`);
      return mod.then((v) => {
        name ||= v.Module?.name;
        log.log(`Load ${name}: ${Object.keys(v).join(' ')}`);
        return {
          module: v.Module,
        } satisfies DynamicModule;
      });
    });
    return mod;
  }
}

interface IModule {
  Module: Type<any>;
}
