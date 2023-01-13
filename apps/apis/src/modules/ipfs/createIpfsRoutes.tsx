import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { ErrorSuspenseBoundary, PageErrorState } from 'common/src/components';

const IpfsPage = lazy(() => import('./IpfsPage'));
const IpfsAccess = lazy(() => import('./IpfsAccess'));
const IpfsGatewayCheck = lazy(() => import('./gateway/IpfsGatewayCheck'));
const IpfsGatewaySetting = lazy(() => import('./gateway/IpfsGatewaySetting'));

export function createIpfsRoutes(): RouteObject[] {
  return [
    {
      path: 'ipfs',
      element: (
        <IpfsPage>
          <ErrorSuspenseBoundary>
            <Outlet />
          </ErrorSuspenseBoundary>
        </IpfsPage>
      ),
      errorElement: <PageErrorState />,
      children: [
        {
          index: true,
          element: <IpfsAccess />,
        },
        {
          path: ':hash',
          element: <IpfsAccess />,
        },
        {
          path: 'gateway',
          children: [
            {
              path: 'check',
              element: <IpfsGatewayCheck />,
            },
          ],
        },
        {
          path: 'setting',
          children: [
            {
              path: 'gateway',
              element: <IpfsGatewaySetting />,
            },
          ],
        },
      ],
    },
  ];
}
