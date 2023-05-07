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
        },
        {
          handle: {
            title: '密码强度检测',
          },
          path: 'strength/:password',
          lazy: lazyRouter(() => import('./strength')),
        },
      ],
    },
  ];
}

function lazyRouter(a: () => Promise<RouteObject|{ default: RouteObject }>): () => Promise<RouteObject> {
  return () => a().then(v => 'default' in v ?v.default:v);
}
