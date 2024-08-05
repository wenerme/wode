import React from 'react';
import { HiAdjustmentsHorizontal, HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2';
import { DynamicModule } from '../../../web';
import { ConsoleLayoutContext } from '../../ConsoleLayoutContext';
import { createRoutes } from '../../createRoutes';

export default {
  createRoutes,
  onModuleInit: (ctx) => {
    ctx.as<ConsoleLayoutContext>().add('console.menu.bottom', [
      {
        type: 'group',
        name: 'setting',
        items: [
          {
            title: '设置',
            href: '/setting',
            icon: <HiOutlineAdjustmentsHorizontal className={'h-6 w-6'} />,
            iconActive: <HiAdjustmentsHorizontal className={'h-6 w-6'} />,
          },
        ],
      },
    ]);
  },
} satisfies DynamicModule;
