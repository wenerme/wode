import React from 'react';
import { type createBrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'common/src/daisy/theme';
import { type RouteObjects } from 'common/src/router';
import { type DynamicModuleLoader, ModuleProvider, ModuleRouterProvider } from 'common/src/system/module';
import { RootContext } from './RootContext';

export const ModuleApp: React.FC<ModuleAppProps> = ({ loader, createRoutes, createRouter }) => {
  return (
    <ThemeProvider>
      <RootContext>
        <ModuleProvider loader={loader}>
          <ModuleRouterProvider createRoutes={createRoutes} createRouter={createRouter} />
        </ModuleProvider>
      </RootContext>
    </ThemeProvider>
  );
};

export interface ModuleAppProps {
  loader: DynamicModuleLoader;
  createRoutes?: (routes: RouteObjects) => RouteObjects;
  createRouter?: (routes: RouteObjects) => ReturnType<typeof createBrowserRouter>;
}
