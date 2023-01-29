import React, { useCallback } from 'react';
import { SiteConfProvider } from 'common/src/system/components';
import { ModuleProvider, ModuleRouterProvider } from 'common/src/system/module';
import { AppContext } from './AppContext';
import { RootContext } from './RootContext';
import { createPrimaryLayoutRoutes } from './createPrimaryLayoutRoutes';

export const ModuleApp = () => {
  return (
    <SiteConfProvider>
      <RootContext>
        <ModuleProvider loader={useCallback((name) => import(`../modules/${name}/index.ts`), [])}>
          <AppContext>
            <ModuleRouterProvider createRoutes={createPrimaryLayoutRoutes} />
          </AppContext>
        </ModuleProvider>
      </RootContext>
    </SiteConfProvider>
  );
};
