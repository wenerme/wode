import React, { lazy } from 'react';
import { HiColorSwatch, HiOutlineColorSwatch } from 'react-icons/hi';
import type { RouteObject } from 'react-router-dom';
import { Navigate, Outlet } from 'react-router-dom';
import { ErrorSuspenseBoundary, PageErrorState } from 'common/src/components';

const SettingAppearance = lazy(() => import('common/src/components/system/SettingAppearance'));
const SystemInfo = lazy(() => import('common/src/components/system/SystemInfo'));
const SettingPage = lazy(() => import('./setting/SettingPage'));

export function createSystemRoutes(): RouteObject[] {
  return [
    {
      path: 'setting',
      element: (
        <SettingPage>
          <ErrorSuspenseBoundary>
            <Outlet />
          </ErrorSuspenseBoundary>
        </SettingPage>
      ),
      errorElement: <PageErrorState />,
      children: [
        {
          index: true,
          element: (
            <div className={'h-full w-full flex flex-col items-center justify-center'}>
              <h3 className={'text-lg opacity-70'}>调整系统或模块功能</h3>
            </div>
          ),
        },
        {
          path: 'appearance',
          meta: {
            title: '显示和行为',
            icon: <HiOutlineColorSwatch />,
            menu: {
              type: 'title',
            },
          },
          children: [
            {
              index: true,
              element: <SettingAppearance />,
              meta: {
                title: '显示设置',
                icon: <HiOutlineColorSwatch />,
                iconActive: <HiColorSwatch />,
              },
            },
          ],
        },
        {
          path: 'system',
          children: [
            {
              index: true,
              element: <Navigate to={'info'} />,
            },
            {
              path: 'info',
              element: <SystemInfo />,
            },
          ],
        },
      ],
    },
  ];
}
