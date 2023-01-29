import React, { useCallback, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useStore } from 'zustand';
import { LoadingIndicator } from '../../components';
import { type RouteObjects } from '../../router';
import { getModuleStore } from './ModuleStore';
import { createModuleRouter } from './loadModules';

export const ModuleRouterProvider: React.FC<{
  createRoutes?: (routes: RouteObjects) => RouteObjects;
}> = ({ createRoutes }) => {
  const store = getModuleStore();
  const routes = useStore(
    store,
    useCallback((s) => s.routes, []),
  );
  // only init once
  useEffect(() => {
    if (!routes) {
      return;
    }
    const router = createModuleRouter({ createRoutes });
    store.setState({ router });
  }, []);
  const router = useStore(
    store,
    useCallback((s) => s.router, []),
  );
  if (!router) {
    return <LoadingIndicator />;
  }
  return <RouterProvider router={router} fallbackElement={<LoadingIndicator />} />;
};
