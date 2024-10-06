import React from 'react';
import { HiColorSwatch, HiOutlineColorSwatch } from 'react-icons/hi';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { isDev } from '@wener/console';
import { lazyRoute } from '@wener/console/router';
import { PageErrorState } from '@wener/console/web';
import { can } from '@/casl';
import { SiteModules } from '@/console/modules/user.core/SiteModules';

export function createRoutes(): RouteObject[] {
  const routes: RouteObject[] = [
    {
      index: true,
      element: <Navigate to={'home'} replace />,
    },
    {
      path: '/home',
      lazy: lazyRoute(() => import('./routes/home.route')),
    },
    {
      path: '/user/:userId',
      lazy: lazyRoute(() => import('./routes/user.$userId.route')),
    },
    {
      path: 'setting',
      handle: {
        title: '设置',
      },
      lazy: lazyRoute(() => import('./routes/setting.route')),
      errorElement: <PageErrorState />,
      children: [
        {
          index: true,
          element: (
            <div className={'flex h-full w-full flex-col items-center justify-center'}>
              <h3 className={'text-lg opacity-70'}>调整系统或模块功能</h3>
            </div>
          ),
        },
        {
          path: 'profile',
          handle: {
            title: '编辑资料',
          },
          lazy: lazyRoute(() => import('./routes/setting.profile.route')),
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
              lazy: lazyRoute(() => import('./routes/setting.appearance.route')),
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
              element: <Navigate replace to={'about'} />,
            },
            {
              path: 'about',
              lazy: lazyRoute(() => import('./routes/setting.system.route')),
              handle: {
                title: '系统信息',
              },
            },
          ],
        },
        {
          path: 'dev',
          children: [
            {
              path: 'debug',
              lazy: lazyRoute(() => import('./routes/setting.dev.debug.route')),
              handle: {
                title: '调试设置',
              },
            },
          ],
        },
      ],
    },
  ];

  for (let [, { path, createRoutes }] of Object.entries(SiteModules)) {
    if (can('view', 'page', path)) {
      routes.push(...createRoutes());
    }
  }

  if (isDev()) {
    console.log(`Final Routes`, routes);
  }
  return routes;
}
