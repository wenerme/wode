import type { ReactNode } from 'react';
import React, { lazy } from 'react';
import { HiColorSwatch, HiOutlineColorSwatch } from 'react-icons/hi';
import type { RouteObject } from 'react-router-dom';
import { Navigate, Outlet } from 'react-router-dom';
import { ErrorSuspenseBoundary, NotFoundPage } from 'common/src/components';
import { trpcClient } from '../utils/trpc';
import { PrimaryLayout } from './PrimaryLayout';
import { WenerApiHome } from './WenerApiHome';

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

const ZxcvbnPasswordStrength = lazy(() => import('./password/zxcvbn/ZxcvbnPasswordStrength'));
const SettingAppearance = lazy(() => import('common/src/components/system/SettingAppearance'));
const SystemInfo = lazy(() => import('common/src/components/system/SystemInfo'));
const SettingPage = lazy(() => import('./setting/SettingPage'));
const IpfsPage = lazy(() => import('./ipfs/IpfsPage'));
const IpfsGatewayCheck = lazy(() => import('./ipfs/gateway/IpfsGatewayCheck'));
const IpfsGatewaySetting = lazy(() => import('./ipfs/gateway/IpfsGatewaySetting'));

export function createRouters(): RouteObject[] {
  return [
    {
      element: (
        <PrimaryLayout>
          <ErrorSuspenseBoundary>
            <Outlet />
          </ErrorSuspenseBoundary>
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
          element: <WenerApiHome />,
        },
        {
          path: 'ipfs',
          element: (
            <IpfsPage>
              <ErrorSuspenseBoundary>
                <Outlet />
              </ErrorSuspenseBoundary>
            </IpfsPage>
          ),
          children: [
            {
              index: true,
              element: <Navigate to={'gateway/check'} />,
            },
            {
              path: 'gateway',
              children: [
                {
                  path: 'check',
                  element: <IpfsGatewayCheck />,
                },
              ],
            },
            {
              path: 'setting',
              children: [
                {
                  path: 'gateway',
                  element: <IpfsGatewaySetting />,
                },
              ],
            },
          ],
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
  ];
}
