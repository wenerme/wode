'use client';

import React, { PropsWithChildren } from 'react';
import { PrimaryLayout } from '../../components/PrimaryLayout';
import { WenerLogo } from '../../components/WenerLogo';
import { AppSystemAbout } from '../../components/AppSystemAbout';
import { ComponentProvider, SiteConfProvider } from 'common/src/system/components';
import { createBrowserRouter, createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { ErrorSuspenseBoundary } from '@wener/reaction';
import { HomePage } from '../../components/HomePage';
import { SessionProvider } from 'next-auth/react';
import { Setup } from 'common/src/layouts';
import { createPasswordRoutes } from '../password';

const createRouter = typeof window === 'undefined' ? createMemoryRouter : createBrowserRouter;
const router = createRouter([
  {
    element: <PrimaryLayout>
      <Outlet />
    </PrimaryLayout>,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      ...createPasswordRoutes(),
    ],
  },
]);

export const DashApp: React.FC<PropsWithChildren> = ({ children }) => {
  return <ComponentProvider
    components={{
      Logo: WenerLogo,
      SystemAbout: AppSystemAbout,
    }}
  >
    <SiteConfProvider>
      <SessionProvider>
        <Setup>
          <ErrorSuspenseBoundary>
            <RouterProvider router={router} />
          </ErrorSuspenseBoundary>
        </Setup>
      </SessionProvider>
    </SiteConfProvider>
  </ComponentProvider>;
};

