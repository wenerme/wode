import React, { useEffect } from 'react';
import { createHashRouter as createRouter, Outlet, RouterProvider, useInRouterContext } from 'react-router-dom';
import { Authenticated } from '@src/client/console/Authenticated';
import { ContextStoreProvider, isDev, useExposeDebug, useLogger } from '@wener/console';
import { LoadingIndicator } from '@wener/console/loader';
import { lazyRoute, RouteObjects, useRouteTitles } from '@wener/console/router';
import { DynamicModule, getConsoleContext, NotFoundPage, PageErrorState } from '@wener/console/web';
import { UserAuthExpireOverlay, UserLockOverlay } from '@wener/console/web/user';
import { ErrorSuspenseBoundary, useAsyncEffect } from '@wener/reaction';
import { createStore, useStore } from 'zustand';
import { PrimaryLayout } from './PrimaryLayout';

export const ConsoleApp = () => {
  return <Content />;
};

const RootStore = createStore<{
  router?: any;
  routes: RouteObjects;
  state?: string;
}>(() => {
  return {
    state: 'New',
    routes: [],
  };
});

const Content = () => {
  const router = useStore(RootStore, (v) => v.router);
  const state = useStore(RootStore, (v) => v.state);
  const log = useLogger('ConsoleContent');
  useExposeDebug({
    RootStore,
  });

  useAsyncEffect(async () => {
    const { state } = RootStore.getState();
    const setState = (state: string) => {
      RootStore.setState({ state });
    };

    if (state !== 'New') {
      // avoid restrict mode rerender
      log(`Skip reinit APP`);
      return;
    }
    log('Initializing');
    setState('Pending');

    const moduleService = getConsoleContext().getModuleService();
    moduleService.loader = loadModule;

    try {
      await moduleService.loadModules([
        //
        'site.core',
        'user.core',
      ]);
    } catch (e) {
      console.error('load module failed', e);
      setState('Error');
      return;
    }

    const routes: RouteObjects = await moduleService.createRoutes();
    const router = createRouter(createRootRoutes(routes));
    RootStore.setState({ router, routes });
    setState('Done');
    log('Initialized');

    if (isDev()) {
      log(`Final Store`, moduleService.store.getState());
    }
  }, [state]);

  if (!router) {
    log(`Router not ready: ${state}`);
    return <LoadingIndicator />;
  }
  return (
    <ContextStoreProvider value={getConsoleContext().getModuleService().store}>
      <UserAuthExpireOverlay />
      <UserLockOverlay />
      <RouterProvider
        router={router}
        fallbackElement={<LoadingIndicator />}
        future={{
          v7_startTransition: true,
        }}
      />
    </ContextStoreProvider>
  );
};

export default ConsoleApp;

function createRootRoutes(children: RouteObjects): RouteObjects {
  return [
    {
      element: (
        <>
          {/*<ResourceContext>*/}
          <RootRouteReactor />
          <PrimaryLayout>
            <ErrorSuspenseBoundary>
              <Outlet />
            </ErrorSuspenseBoundary>
          </PrimaryLayout>
          {/*</ResourceContext>*/}
        </>
      ),
      errorElement: <PageErrorState />,
      handle: {
        title: 'Wode',
      },
      children: [
        {
          index: true,
          lazy: lazyRoute(() => import('./home/route')),
        },
        ...children,
        {
          path: '*',
          element: <NotFoundPage />,
        },
      ],
    },
  ];
}

const RootRouteReactor = () => {
  if (!useInRouterContext()) {
    return null;
  }
  const titles = useRouteTitles();
  const title = titles.join(' » ');
  useEffect(() => {
    document.title = title;
  }, [title]);
  return <></>;
};

function loadModule(name: string): Promise<DynamicModule> {
  return import(`./modules/${name}/module.tsx`).then((v) => v.default);
}
