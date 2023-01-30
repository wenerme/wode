import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate, Outlet } from 'react-router-dom';
import { ErrorSuspenseBoundary, PageErrorState } from 'common/src/components';
import { getTrpcProxyClient } from '../../common';

const ZxcvbnPasswordStrength = lazy(() => import('./zxcvbn/ZxcvbnPasswordStrength'));

export function createPasswordRoutes(): RouteObject[] {
  return [
    {
      path: 'password',
      handle: {
        title: '密码',
      },
      element: (
        <ErrorSuspenseBoundary>
          <Outlet />
        </ErrorSuspenseBoundary>
      ),
      children: [
        {
          index: true,
          element: <Navigate to={'strength'} />,
        },
        {
          handle: {
            title: '密码强度检测',
          },
          path: 'strength',
          element: <ZxcvbnPasswordStrength />,
          errorElement: <PageErrorState />,
          action: ({ params: { password = '123456789' } }) => {
            return getTrpcProxyClient().password.zxcvbn.query({ password });
          },
          loader: ({ request }) => {
            return getTrpcProxyClient().password.zxcvbn.query({
              password: new URL(request.url).searchParams.get('password') || '123456',
            });
          },
        },
      ],
    },
  ];
}
