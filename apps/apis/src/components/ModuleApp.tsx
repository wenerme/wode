import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LoadingIndicator } from 'common/src/components';
import { RouteObjects } from 'common/src/router';
import { createStore, useStore } from 'zustand';
import { useAsyncEffect, useDebugRender } from '@wener/reaction';
import { createLazyPromise } from '@wener/utils';
import { AppContext } from './AppContext';
import { DynamicModule, Module } from './Module';
import { getSiteConfStore, SiteConfProvider } from './SiteConfProvider';
import { createPrimaryLayoutRoutes } from './createPrimaryLayoutRoutes';
import { SiteModuleConf } from './schema';

export const ModuleApp = () => {
  const router = useStore(
    ModuleSystemStore,
    useCallback((state) => state.router, []),
  );
  return (
    <SiteConfProvider>
      <ModuleProvider>
        <AppContext>{router && <RouterProvider router={router} fallbackElement={<LoadingIndicator />} />}</AppContext>
      </ModuleProvider>
    </SiteConfProvider>
  );
};

const ModuleProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const [init, setInit] = useState(false);
  useEffect(() => {
    // fixme handle error
    Loader.finally(() => setInit(true));
  }, []);
  if (!init) {
    return <LoadingIndicator />;
  }
  return <>{children}</>;
};

function useModuleSystemSetup() {
  const log = useDebugRender('useModuleSystemSetup');
  useAsyncEffect(async () => {
    await Loader;
    log('System loaded');
  }, []);
}

const Loader = createLazyPromise(async () => {
  // will not dynamic change - disable/enable module need refresh
  if (ModuleSystemStore.getState().router) {
    return;
  }
  const src = getSiteConfStore().getState().module?.src;

  if (!src) {
    // empty
    const router = createBrowserRouter(createPrimaryLayoutRoutes(() => []));
    ModuleSystemStore.setState((state) => {
      return { ...state, modules: [], router, routes: [] };
    });
    return;
  }

  const conf = { ...getSiteConfStore().getState().module.config };
  conf.disabled ||= [];
  const enabled = new Set(conf.include);
  conf.disabled.forEach((v) => enabled.delete(v));
  const cond = Array.from(enabled).map(async (name) => {
    const module: DynamicModule = await import(`../modules/${name}/index.ts`)
      .then((mod) => {
        console.debug('Module loaded', mod.id || name);
        return mod;
      })
      .catch((e) => {
        console.error('Module load failed', name, e);
      });
    if (!module) {
      return;
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
  const router = createBrowserRouter(createPrimaryLayoutRoutes(() => routes));
  ModuleSystemStore.setState((state) => {
    return { ...state, modules, router, routes };
  });

  console.debug('Module initialized', { routes, router });
});

interface IModuleSystemStore {
  router: ReturnType<typeof createBrowserRouter>;
  routes: RouteObjects;
  modules: Module[];
}

const createModuleSystemStore = (): IModuleSystemStore => {
  return {
    // after init always defined
    router: undefined as any as ReturnType<typeof createBrowserRouter>,
    routes: [],
    modules: [],
  };
};
const ModuleSystemStore = createStore<IModuleSystemStore>(createModuleSystemStore);
