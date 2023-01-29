import React, { memo, useCallback } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LoadingIndicator } from 'common/src/components';
import { RouteObjects } from 'common/src/router';
import { getBaseUrl } from 'common/src/runtime';
import { z } from 'zod';
import { createStore, useStore } from 'zustand';
import { useAsyncEffect, useDebugRender } from '@wener/reaction';
import { createLazyPromise } from '@wener/utils';
import { AppContext } from './AppContext';
import { DynamicModule, Module } from './Module';
import { createPrimaryLayoutRoutes } from './createPrimaryLayoutRoutes';

export const ModuleApp = () => {
  const router = useStore(
    ModuleSystemStore,
    useCallback((state) => state.router, []),
  );
  return (
    <AppContext>
      <ModuleSystemReactor />
      {router && <RouterProvider router={router} fallbackElement={<LoadingIndicator />} />}
    </AppContext>
  );
};

function useModuleSystemSetup() {
  const log = useDebugRender('useModuleSystemSetup');
  useAsyncEffect(async () => {
    await SystemLoader;
    log('System loaded');
  }, []);
}

const SystemLoader = createLazyPromise(async () => {
  // will not dynamic change - disable/enable module need refresh
  if (ModuleSystemStore.getState().router) {
    return;
  }

  const conf: ModuleConf = await fetch(`${getBaseUrl()}/module.config.json`).then((v) => v.json());
  conf.disabled ||= [];
  try {
    let result = ModuleConf.partial().safeParse(JSON.parse(localStorage['__MODULE_CONF__']));
    if (result.success) {
      const { data } = result;
      conf.disabled = conf.disabled.concat(data.disabled || []);
    }
  } catch (e) {}

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

const ModuleSystemReactor = memo(() => {
  useModuleSystemSetup();
  return null;
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

const ModuleConf = z.object({
  include: z.string().array(),
  disabled: z.string().array().optional(),
});

type ModuleConf = z.infer<typeof ModuleConf>;
