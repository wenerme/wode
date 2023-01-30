import React, { useCallback, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useStore } from 'zustand';
import { LoadingIndicator } from '../../components';
import { type RouteObjects } from '../../router';
import { getModuleStore } from './ModuleStore';

export const ModuleRouterProvider: React.FC<{
  createRoutes?: (routes: RouteObjects) => RouteObjects;
  createRouter?: (routes: RouteObjects) => ReturnType<typeof createBrowserRouter>;
}> = ({ createRoutes = (v) => v, createRouter = createBrowserRouter }) => {
  const store = getModuleStore();
  const routes = useStore(
    store,
    useCallback((s) => s.routes, []),
  );
  useEffect(() => {
    if (!routes.length) {
      return;
    }
    store.setState((s) => {
      // NOTE 暂不支持动态调整路由
      if (s.router) {
        return s;
      }
      const router = createRouter(createRoutes(s.routes));
      console.debug(`Setup router`, router);
      return { ...s, router };
    });
  }, [routes]);
  const router = useStore(
    store,
    useCallback((s) => s.router, []),
  );
  if (!router) {
    return <LoadingIndicator />;
  }
  return <RouterProvider router={router} fallbackElement={<LoadingIndicator />} />;
};
