import { type RouteObjects } from '../../router';
import { getSiteConfStore } from '../components';
import { type DynamicModule, type DynamicModuleLoader, type Module } from './Module';
import { getModuleStore } from './ModuleStore';

export async function loadModules({ loader }: { loader: DynamicModuleLoader }) {
  const store = getModuleStore();
  const conf = { ...getSiteConfStore().getState().module };
  conf.disabled ||= [];
  const enabled = new Set(conf.include);
  conf.disabled.forEach((v) => enabled.delete(v));
  const cond = Array.from(enabled).map(async (name) => {
    const last = store.getState().modules?.find((v) => v.id === name);
    if (last) {
      return last;
    }

    let module: DynamicModule;
    try {
      module = await loader(name);
      console.debug('Module loaded', module.id || name);
    } catch (e) {
      console.error('Module load failed', name, e);
      throw e;
    }

    if (module.createModule) {
      return {
        id: name,
        ...module.createModule(),
        module,
      };
    }
    return {
      id: name,
      module,
      createRoutes: module.createRoutes,
    };
  });
  const modules = (await Promise.allSettled(cond))
    // .filter((v) => v.status === 'fulfilled') // can not narrow down typing :<
    .map((v) => (v as any).value as Module)
    .filter(Boolean);

  const routes: RouteObjects = (await Promise.all(modules.map((v) => v.createRoutes?.() ?? []))).flat();
  store.setState((state) => {
    return { ...state, modules, routes };
  });

  console.debug('Module initialized');
}
