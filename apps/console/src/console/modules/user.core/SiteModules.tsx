import React, { type ReactElement } from 'react';
import { BsBuildingFillGear, BsBuildingGear } from 'react-icons/bs';
import { RiFocus2Fill, RiFocus2Line } from 'react-icons/ri';
import type { RouteObject } from 'react-router-dom';
import { createWorkRoutes } from '@/console/createWorkRoutes';

const WorkModule = defineModule({
  name: 'focus',
  title: '工作台',
  path: '/work',
  createRoutes: createWorkRoutes,
  icon: <RiFocus2Line className={'h-6 w-6'} />,
  iconActive: <RiFocus2Fill className={'h-6 w-6'} />,
});

export const FamilyModule = defineModule({
  name: 'family',
  title: '家庭',
  path: '/family',
  createRoutes: () => {
    return [];
  },
});

export const DevOpsModule = defineModule({
  name: 'devops',
  title: 'DevOps',
  path: '/devops',
  createRoutes: () => {
    return [];
  },
});

export const SiteModules = {
  work: WorkModule,
  devops: DevOpsModule,
  family: FamilyModule,
  // work: {
  //   title: '工作台',
  //   name: 'focus',
  //   path: '/work',
  //   createRoutes: createWorkRoutes,
  // },
  // admin: {
  //   ...AdminModule,
  //   path: '/admin',
  //   createRoutes: () => {
  //     return [
  //       {
  //         path: '/admin',
  //         children: createAdminRoutes(),
  //       },
  //     ];
  //   },
  // },
};

export const AdminModule = defineModule({
  title: '系统管理',
  name: 'admin',
  createRoutes: () => {
    return [
      {
        path: '/admin',
        children: [
          {
            path: '*',
            element: <div>Not ready</div>,
          },
        ],
      },
    ];
  },
  icon: <BsBuildingGear className={'h-6 w-6'} />,
  iconActive: <BsBuildingFillGear className={'h-6 w-6'} />,
});

type ModuleDef = {
  name: string;
  title: string;
  path: string;
  createRoutes: () => RouteObject[];
  icon: ReactElement;
  iconActive: ReactElement;
};

type DefineModuleOptions = {
  name: string;
  title: string;
  path?: string;
  createRoutes: () => RouteObject[];
  icon?: ReactElement;
  iconActive?: ReactElement;
};

function defineModule(opts: DefineModuleOptions) {
  const def: ModuleDef = {
    // fixme
    icon: <div />,
    iconActive: <div />,
    path: opts.path || `/${opts.name}`,
    ...opts,
  };
  return def;
}
