import React, { lazy } from 'react';
import { HiColorSwatch, HiOutlineColorSwatch } from 'react-icons/hi';
import { Navigate, Outlet } from 'react-router-dom';
import { ErrorSuspenseBoundary } from '@wener/reaction';
import { PageErrorState } from '../../components';
import type { RouteObjects } from '../../router';
import { SettingRouteId } from './const';

const SettingAppearance = lazy(() => import('./SettingAppearance'));
const SystemInfo = lazy(() => import('./SystemInfo'));
const SettingPage = lazy(() => import('./SettingPage'));

export function createSettingRoutes(): RouteObjects {
  return [
    {
      id: SettingRouteId,
      path: 'setting',
      handle: {
        title: '设置',
      },
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
          handle: {
            title: '显示和行为',
          },
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
              handle: {
                title: '显示设置',
              },
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
              handle: '系统信息',
            },
          ],
        },
      ],
    },
  ];
}