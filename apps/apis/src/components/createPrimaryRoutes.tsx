import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { ErrorSuspenseBoundary, NotFoundPage } from 'common/src/components';
import { PrimaryLayout } from './PrimaryLayout';
import { RootRouteReactor } from './RootRouteReactor';
import { WenerApiHome } from './WenerApiHome';
import { createRoutes } from './createRoutes';

export function createPrimaryRoutes(): RouteObject[] {
  return [
    {
      element: (
        <PrimaryLayout>
          <RootRouteReactor />
          <ErrorSuspenseBoundary>
            <Outlet />
          </ErrorSuspenseBoundary>
        </PrimaryLayout>
      ),
      errorElement: <NotFoundPage />,
      handle: {
        title: 'Wener APIs',
      },
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
