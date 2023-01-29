import React from 'react';
import { Outlet, RouteObject } from 'react-router-dom';
import { ErrorSuspenseBoundary, NotFoundPage } from 'common/src/components';
import { HomePage } from './HomePage';
import { PrimaryLayout } from './PrimaryLayout';
import { RootRouteReactor } from './RootRouteReactor';

export function createPrimaryLayoutRoutes(createRoutes: () => RouteObject[] = () => []): RouteObject[] {
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
