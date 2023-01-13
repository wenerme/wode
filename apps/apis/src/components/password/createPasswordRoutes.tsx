import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate, Outlet } from 'react-router-dom';
import { ErrorSuspenseBoundary, PageErrorState } from 'common/src/components';
import { trpcClient } from '../../utils/trpc';

const ZxcvbnPasswordStrength = lazy(() => import('./zxcvbn/ZxcvbnPasswordStrength'));

export function createPasswordRoutes(): RouteObject[] {
  return [
    {
      path: 'password',
      element: (
        <ErrorSuspenseBoundary>
          <Outlet />
        </ErrorSuspenseBoundary>
      ),
      children: [
        {
          index: true,
          element: <Navigate to={'zxcvbn'} />,
        },
        {
          path: 'zxcvbn',
          element: <ZxcvbnPasswordStrength />,
          errorElement: <PageErrorState />,
          action: ({ params: { password = '123456789' } }) => {
            return trpcClient.password.zxcvbn.query({ password });
          },
          loader: ({ request }) => {
            return trpcClient.password.zxcvbn.query({
              password: new URL(request.url).searchParams.get('password') || '123456',
            });
          },
        },
      ],
    },
  ];
}
