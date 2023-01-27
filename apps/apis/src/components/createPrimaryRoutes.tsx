import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { ErrorSuspenseBoundary, NotFoundPage } from 'common/src/components';
import { HomePage } from './HomePage';
import { PrimaryLayout } from './PrimaryLayout';
import { RootRouteReactor } from './RootRouteReactor';
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
          element: <HomePage />,
        },
        ...createRoutes(),
      ],
    },
  ];
}
