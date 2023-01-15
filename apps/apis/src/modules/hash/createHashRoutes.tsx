import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const HashPage = lazy(() => import('./HashPage'));

export function createHashRoutes(): RouteObject[] {
  return [
    {
      handle: {
        title: '哈希',
      },
      path: 'hash',
      children: [
        {
          index: true,
          element: <HashPage />,
        },
        {
          path: ':content',
          element: <HashPage />,
        },
      ],
    },
  ];
}
