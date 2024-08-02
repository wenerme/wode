import React, { ReactNode, useState } from 'react';
import { createHashRouter, Outlet, RouterProvider, RouterProviderProps } from 'react-router-dom';
import { Router } from '@remix-run/router';
import { ErrorSuspenseBoundary, useAsyncEffect, useDebugRender } from '@wener/reaction';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { LoadingIndicator } from '@/console/components/KnownDefinedComponent';
import { RootRouterReactor } from '@/console/components/RootRouterReactor';
import { getAppState, getRouteStore } from '@/console/container';
import { isDev } from '../const';
import { useLogger } from '../hooks';
import { RouteObjects } from '../router';
import { DynamicModule, getConsoleContext, NotFoundPage, PageErrorState } from '../web';

enum ServiceState {
  New = 'New',
  Pending = 'Pending',
  Done = 'Done',
  Error = 'Error',
}

let _state = ServiceState.New;

export type ConsoleLoaderProps = {
  /**
   * Render root content
   * @param content
   */
  render?: (content: ReactNode) => ReactNode;
  loadModule: (name: string) => Promise<DynamicModule>;
  modules?: string[];
  children?: React.ReactNode;
  createRouter?: (children: RouteObjects) => Router;
  future?: RouterProviderProps['future'];
};

export const ConsoleLoader: React.FC<ConsoleLoaderProps> = ({
  loadModule,
  modules = [],
  render,
  createRouter = createHashRouter,
  // createRootRoutes = _createRootRoutes,
  children,
  future = {
    v7_startTransition: true,
  },
}) => {
  const [router] = useStoreWithEqualityFn(getRouteStore(), ({ router }) => [router], shallow);
  useDebugRender(`ConsoleAppContent`);
  const log = useLogger('ConsoleContent');
  const [state, _setState] = useState(ServiceState.New);

  const setState = (s: ServiceState) => {
    // fixme avoid restrict mode rerender
    _state = s;
    _setState(s);
  };

  useAsyncEffect(async () => {
    if (_state !== 'New') {
      log(`Skip reinit APP`);
      return;
    }
    log('Initializing');
    setState(ServiceState.Pending);

    const moduleService = getConsoleContext().getModuleService();
    moduleService.loader = loadModule;

    try {
      log(`Load modules: ${modules.join(', ')}`);
      await moduleService.loadModules(modules);
      if (isDev()) {
        console.log(`Loaded`, moduleService.modules);
      }
    } catch (e) {
      console.error('load module failed', e);
      setState(ServiceState.Error);
      return;
    }

    const routes: RouteObjects = await moduleService.createRoutes();
    const router = createRouter(
      createRootRoutes({
        children: routes,
        render,
      }),
    );
    getRouteStore().setState({ router, routes });
    setState(ServiceState.Done);
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
    <>
      {children}
      <RouterProvider router={router} fallbackElement={<LoadingIndicator />} future={future} />
    </>
  );
};

function createRootRoutes({
  children,
  render = (children) => children,
}: {
  children: RouteObjects;
  render?: (content: ReactNode) => ReactNode;
}): RouteObjects {
  return [
    {
      element: (
        <>
          <RootRouterReactor />
          {render(
            <ErrorSuspenseBoundary>
              <Outlet />
            </ErrorSuspenseBoundary>,
          )}
        </>
      ),
      errorElement: <PageErrorState />,
      handle: {
        title: getAppState().title,
      },
      children: [
        ...children,
        {
          path: '*',
          element: <NotFoundPage />,
        },
      ],
    },
  ];
}
