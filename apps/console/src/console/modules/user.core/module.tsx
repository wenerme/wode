import React from 'react';
import { HiAdjustmentsHorizontal, HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2';
import { PiSquaresFour, PiSquaresFourLight } from 'react-icons/pi';
import { getApplets, Launcher } from '@wener/console/console';
import { ClockWidget } from '@wener/console/console/applets';
import type { DynamicModule } from '@wener/console/web';
import { CalculatorWidget } from '@/applets/Calculator/CalculatorWidget';
import { PlaygroundWidget } from '@/applets/Playground/PlaygroundWidget';
import { getUserAbility } from '@/casl';
import { DevOpsModule, FamilyModule, SiteModules } from '@/console/modules/user.core/SiteModules';
import type { ConsoleLayoutContext, DashMenuItem } from '../../components/ConsoleLayout/ConsoleLayoutContext';
import { createConsoleRoutes } from '../../createConsoleRoutes';

export default {
  createRoutes: createConsoleRoutes,
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

    // trigger registry
    console.log('Module Init', {
      widgets: Object.keys({ ClockWidget, CalculatorWidget, PlaygroundWidget }),
    });

    const applets = getApplets();
    Launcher.addItems(
      applets.map((app) => {
        const options = app.options;
        return {
          key: options.name,
          title: options.title,
          icon: options.window.icon,
          onLaunch: () => {
            app.toggle();
          },
        };
      }),
    );

    const ability = getUserAbility();
    let items: DashMenuItem[] = [
      {
        title: SiteModules.work.title,
        href: SiteModules.work.path,
        icon: SiteModules.work.icon,
        iconActive: SiteModules.work.iconActive,
      },
      {
        title: '应用',
        icon: <PiSquaresFourLight className={'h-6 w-6'} />,
        iconActive: <PiSquaresFour className={'h-6 w-6'} />,
        onClick: () => {
          Launcher.toggle();
        },
      },
      {
        title: FamilyModule.title,
        href: FamilyModule.path,
        icon: FamilyModule.icon,
        iconActive: FamilyModule.iconActive,
      },
      {
        title: DevOpsModule.title,
        href: DevOpsModule.path,
        icon: DevOpsModule.icon,
        iconActive: DevOpsModule.iconActive,
      },
    ];

    items = items.filter((v) => {
      return ability.can('view', 'page', v.href);
    });

    // as ConsoleLayoutContext
    ctx.add('console.menu.center', [
      {
        type: 'group',
        name: 'focus',
        items: items,
      },
    ]);
  },
} satisfies DynamicModule;
