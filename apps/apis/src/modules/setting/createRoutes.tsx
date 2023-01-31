import React, { lazy } from 'react';
import { AiFillApi, AiOutlineApi } from 'react-icons/ai';
import { createSettingRoutes, DefaultMenuItems } from 'common/src/system/setting';

const DevApiDocs = lazy(() => import('./DevApiDocs'));

export function createRoutes() {
  return createSettingRoutes({
    menu: [
      ...DefaultMenuItems,
      {
        label: 'API 文档',
        href: '/setting/dev/api-docs',
        icon: <AiOutlineApi />,
        iconActive: <AiFillApi />,
      },
    ],
    routes: [
      {
        path: 'dev',
        children: [
          {
            path: 'api-docs',
            element: <DevApiDocs />,
            handle: {
              title: 'API 文档',
            },
          },
        ],
      },
    ],
  });
}
