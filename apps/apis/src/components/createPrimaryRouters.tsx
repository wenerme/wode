import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { ErrorSuspenseBoundary, NotFoundPage } from 'common/src/components';
import { PrimaryLayout } from './PrimaryLayout';
import { WenerApiHome } from './WenerApiHome';
import { createRoutes } from './createRoutes';

export function createPrimaryRouters(): RouteObject[] {
  return [
    {
      element: (
        <PrimaryLayout>
          <ErrorSuspenseBoundary>
            <Outlet />
          </ErrorSuspenseBoundary>
        </PrimaryLayout>
      ),
      errorElement: <NotFoundPage />,
      children: [
        {
          path: '*',
          element: <NotFoundPage />,
        },
        {
          index: true,
          element: <WenerApiHome />,
        },
        ...createRoutes(),
      ],
    },
  ];
}
