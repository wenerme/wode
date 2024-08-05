import React from 'react';
import { ConsoleLauncher, ConsoleLoader } from '@wener/console/console';
import { UserAuthExpireOverlay, UserLockOverlay } from '../console/user';
import { WindowHost } from '../web/window';
import { ConsoleLayout } from './ConsoleLayout';
import { loadModule } from './loadModule';

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
