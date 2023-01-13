import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { ErrorSuspenseBoundary } from 'common/src/components';

const SemverTool = lazy(() => import('./SemverTool'));
const ToolHomePage = lazy(() => import('./ToolHomePage'));
const ToolLayout = lazy(() => import('./ToolLayout'));
const BarcodeTool = lazy(() => import('./BarcodeTool'));
const QrcodeTool = lazy(() => import('./QrcodeTool'));
const UrlExplain = lazy(() => import('./UrlExplain'));

export function createToolRoutes(): RouteObject[] {
  return [
    {
      path: 'tool',
      index: true,
      element: <ToolHomePage />,
    },
    {
      path: 'tool',
      element: (
        <ToolLayout>
          <ErrorSuspenseBoundary>
            <Outlet />
          </ErrorSuspenseBoundary>
        </ToolLayout>
      ),
      children: [
        {
          path: 'semver',
          element: <SemverTool />,
        },
        {
          path: 'barcode',
          element: <BarcodeTool />,
        },
        {
          path: 'qrcode',
          element: <QrcodeTool />,
        },
        {
          path: 'url-explain',
          element: <UrlExplain />,
        },
      ],
    },
  ];
}
