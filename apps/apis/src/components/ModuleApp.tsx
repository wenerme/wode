import React, { useCallback } from 'react';
import { RouterProvider } from 'react-router-dom';
import { LoadingIndicator } from 'common/src/components';
import { SiteConfProvider } from 'common/src/system/components';
import { useStore } from 'zustand';
import { AppContext } from './AppContext';
import { getModuleStore, ModuleProvider } from './ModuleProvider';

export const ModuleApp = () => {
  const router = useStore(
    getModuleStore(),
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
