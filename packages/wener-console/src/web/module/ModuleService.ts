import type { RouteObject } from 'react-router-dom';
import { createStore, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DynamicStore } from './DynamicStore';
import type { DynamicModule } from './types';

class DynamicModuleContext extends DynamicStore {
  constructor(
    private readonly module: DynamicModule,
    store: StoreApi<any>,
  ) {
    super(store);
  }
}

export class ModuleService {
  readonly store = createStore(
    immer(() => {
      return {};
    }),
  );

  private instances: ModuleInstance[] = [];

  get modules() {
    return this.instances.map((v) => v.module);
  }

  constructor(public loader: (name: string) => Promise<DynamicModule>) {}

  async loadModules(names: string[]) {
    const last = this.instances.map((v) => v.name);
    names = names.filter((v) => last.indexOf(v) < 0);
    const loaded = await Promise.all(
      names.map(async (name) => {
        const module = await this.loader(name);
        return { module, name, context: new DynamicModuleContext(module, this.store) };
      }),
    );
    // ensure order
    await Promise.all(
      loaded.map(async ({ module, context }) => {
        if ('onModuleInit' in module) {
          await module.onModuleInit?.(context);
        }
      }),
    );
    this.instances = [...this.instances, ...loaded];
    // wait to next tick, ensure the SetState take effects
    await Promise.resolve();
  }

  async createRoutes(): Promise<RouteObject[]> {
    const all = await Promise.all(this.instances.map((v) => v.module?.createRoutes?.(v.context)));
    return all.flat().filter((x): x is NonNullable<typeof x> => Boolean(x));
  }
}

interface ModuleInstance {
  context: DynamicModuleContext;
  module: DynamicModule;
  name: string;
}
