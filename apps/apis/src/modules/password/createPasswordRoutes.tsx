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
          lazy: lazyRouter(() => import('./strength')),
          // element: <ZxcvbnPasswordStrength />,
          // errorElement: <PageErrorState />,
          // action: ({ params: { password = '123456789' } }) => {
          //   return getTrpcProxyClient().password.zxcvbn.query({ password });
          // },
          // loader: ({ request }) => {
          //   return getTrpcProxyClient().password.zxcvbn.query({
          //     password: new URL(request.url).searchParams.get('password') || '123456',
          //   });
          // },
        },
        {
          handle: {
            title: '密码强度检测',
          },
          path: 'strength/{password}',
          element: <ZxcvbnPasswordStrength />,
          errorElement: <PageErrorState />,
          action: ({ params: { password = '123456789' } }) => {
            return getTrpcProxyClient().password.zxcvbn.query({ password });
          },
          loader: ({ request }) => {
            let password = new URL(request.url).searchParams.get('password') || '123456';
            if (password.endsWith('.html')) {
              password = password.slice(0, -5);
            }
            return getTrpcProxyClient().password.zxcvbn.query({
              password: password,
            });
          },
        },
      ],
    },
  ];
}

function lazyRouter(a: () => Promise<RouteObject|{ default: RouteObject }>): () => Promise<RouteObject> {
  return () => a().then(v => 'default' in v ?v.default:v);
}
