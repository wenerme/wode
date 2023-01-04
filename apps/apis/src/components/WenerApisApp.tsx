import type { ReactNode } from 'react';
import React from 'react';
import { HiColorSwatch, HiOutlineColorSwatch } from 'react-icons/hi';
import { ImLab } from 'react-icons/im';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { ErrorSuspenseBoundary, NotFoundPage } from 'common/src/components';
import { SystemInfo } from 'common/src/components/system';
import { SettingAppearance } from 'common/src/components/system/SettingAppearance';
import { ThemeStateReactor } from 'common/src/daisy/theme';
import { trpcClient } from '../utils/trpc';
import { PrimaryLayout } from './PrimaryLayout';
import { ZxcvbnPasswordStrength } from './password/zxcvbn/ZxcvbnPasswordStrength';
import { SettingPage } from './setting/SettingPage';

declare module 'react-router-dom' {
  export interface IndexRouteObject {
    meta?: RouteObjectMeta;
  }

  export interface NonIndexRouteObject {
    meta?: RouteObjectMeta;
  }
}

export interface RouteObjectMeta {
  id?: string;
  title?: string;
  icon?: ReactNode;
  menu?: Record<string, any>;

  [k: string]: any;
}

const router = createBrowserRouter(
  [
    {
      element: (
        <PrimaryLayout>
          <Outlet />
        </PrimaryLayout>
      ),
      errorElement: <NotFoundPage />,
      children: [
        {
          path: '*',
          element: <NotFoundPage />,
        },
        {
          index: true,
          element: (
            <div className={'flex h-full items-center justify-center'}>
              <div className="card w-96 glass">
                <div className="card-body">
                  <h2 className="card-title">
                    <ImLab /> Wener&apos;s APIs
                  </h2>
                  <p>Just writing some codes & make it accessible.</p>
                </div>
              </div>
            </div>
          ),
        },
        {
          path: 'setting',
          element: (
            <SettingPage>
              <ErrorSuspenseBoundary>
                <Outlet />
              </ErrorSuspenseBoundary>
            </SettingPage>
          ),
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
        {
          path: 'password',
          children: [
            {
              index: true,
              element: <Navigate to={'zxcvbn'} />,
            },
            {
              path: 'zxcvbn',
              element: <ZxcvbnPasswordStrength />,
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
      ],
    },
  ],
  {
    // basename: '/',
  },
);

export const WenerApisApp: React.FC = () => {
  return (
    <>
      <ThemeStateReactor />
      <RouterProvider router={router} />
    </>
  );
};
export default WenerApisApp;
