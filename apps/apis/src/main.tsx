import React from 'react';
import ReactDOM from 'react-dom/client';
import 'common/src/styles/globals.css';
import { ComponentProvider, SiteConfProvider } from 'common/src/system/components';
import { ModuleApp } from './app';
import { AppSystemAbout } from './components/AppSystemAbout';
import { WenerLogo } from './components/WenerLogo';
import { createPrimaryLayoutRoutes } from './components/createPrimaryLayoutRoutes';

ReactDOM.createRoot(document.getElementById('__next') as HTMLElement).render(
  <React.StrictMode>
    <ComponentProvider
      components={{
        Logo: WenerLogo,
        SystemAbout: AppSystemAbout,
      }}
    >
      <SiteConfProvider>
        <ModuleApp loader={(name) => import(`./modules/${name}/index.ts`)} createRoutes={createPrimaryLayoutRoutes} />
      </SiteConfProvider>
    </ComponentProvider>
  </React.StrictMode>,
);
