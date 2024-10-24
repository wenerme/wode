import React, { lazy } from 'react';
import ReactDOM from 'react-dom/client';
import type { BuildInfo } from '@wener/console/buildinfo';
import { UpdateNotification } from '@wener/console/web';
import { ProdOnly } from '@/components/ProdOnly';
import { ConsoleApp } from '@/console/ConsoleApp';
import { RootContext } from '@/console/RootContext';
import { SiteActions } from '@/foundation/Site/SiteActions';
import { SiteLoader } from '@/foundation/Site/SiteLoader';
import './base.init';
import '../instance/instance.init';
import { SiteSidecar } from '@/foundation/Site/SiteSidecar';

// web-vitals.js may block by client
const WebVitals = lazy(() => import('@/components/WebVitals').then((m) => ({ default: m.WebVitals })));
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootContext>
      <SiteLoader
        getSiteConf={async () => {
          return (await SiteActions.resolveSiteConf({})) ?? {};
        }}
      >
        <ConsoleApp />
        <SiteSidecar />
      </SiteLoader>
      <ProdOnly>
        <UpdateNotification
          getVersion={async () => {
            const res = await fetch('/version.json');
            const data: BuildInfo = await res.json();
            return data.date || data.version;
          }}
        />
      </ProdOnly>
    </RootContext>
    <ProdOnly>
      <WebVitals />
    </ProdOnly>
  </React.StrictMode>,
);
