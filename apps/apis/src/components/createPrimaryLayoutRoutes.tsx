import React from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorSuspenseBoundary, NotFoundPage } from 'common/src/components';
import { type RouteObjects } from 'common/src/router';
import { getSiteConf } from 'common/src/system/components';
import { HomePage } from './HomePage';
import { PrimaryLayout } from './PrimaryLayout';
import { RootRouteReactor } from './RootRouteReactor';

export function createPrimaryLayoutRoutes(routes: RouteObjects): RouteObjects {
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
        title: getSiteConf().title,
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
        ...routes,
      ],
    },
  ];
}
