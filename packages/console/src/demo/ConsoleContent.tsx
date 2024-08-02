import React from 'react';
import { ConsoleLauncher, ConsoleLoader } from '@wener/console/console';
import { WindowHost } from '@wener/console/web/window';
import { ConsoleLayout } from '@/demo/ConsoleLayout';
import { loadModule } from '@/demo/loadModule';
import { UserAuthExpireOverlay, UserLockOverlay } from '../console/user';

export const ConsoleContent = () => {
  return (
    <ConsoleLoader
      loadModule={loadModule}
      modules={[
        //
        'site.core',
        'user.core',
      ]}
      render={(content) => {
        return <ConsoleLayout>{content}</ConsoleLayout>;
      }}
    >
      <UserAuthExpireOverlay />
      <UserLockOverlay />
      <WindowHost />
      <ConsoleLauncher />
    </ConsoleLoader>
  );
};
export default ConsoleContent;
