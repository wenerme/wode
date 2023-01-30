import React from 'react';
import { ThemeProvider } from 'common/src/daisy/theme';
import { RouteObjects } from 'common/src/router';
import { SiteConfProvider } from 'common/src/system/components';
import { DynamicModuleLoader, ModuleProvider, ModuleRouterProvider } from 'common/src/system/module';
import { RootContext } from './RootContext';

export const ModuleApp: React.FC<{
  loader: DynamicModuleLoader;
  createRoutes?: (routes: RouteObjects) => RouteObjects;
}> = ({ loader, createRoutes }) => {
  return (
    <ThemeProvider>
      <RootContext>
        <ModuleProvider loader={loader}>
          <ModuleRouterProvider createRoutes={createRoutes} />
        </ModuleProvider>
      </RootContext>
    </ThemeProvider>
  );
};
