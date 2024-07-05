import React from 'react';
import { ConsoleLoader } from '@/console/ConsoleLoader';
import { Launcher } from '@/console/Launcher';
import { DemoConsoleLayout } from '@/demo/DemoConsoleLayout';
import { loadDemoModule } from '@/demo/loadDemoModule';
import { UserAuthExpireOverlay, UserLockOverlay } from '@/web/user';
import { WindowHost } from '@/web/window';

export const DemoConsole = () => {
  return (
    <ConsoleLoader
      loadModule={loadDemoModule}
      modules={[
        //
        'site.core',
        'user.core',
      ]}
      render={(content) => {
        return <DemoConsoleLayout>{content}</DemoConsoleLayout>;
      }}
    >
      <UserAuthExpireOverlay />
      <UserLockOverlay />
      <WindowHost />
      <Launcher />
    </ConsoleLoader>
  );
};
