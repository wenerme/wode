import React from 'react';
import { ConsoleLauncher, ConsoleLoader } from '@wener/console/console';
import { UserAuthExpireOverlay, UserLockOverlay } from '@wener/console/web/user';
import { WindowHost } from '@wener/console/web/window';
import { ConsoleLayout } from '@/demo/ConsoleLayout';
import { loadModule } from '@/demo/loadModule';

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
