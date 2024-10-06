import React from 'react';
import { ConsoleLoader, Launcher, type UserProfileData } from '@wener/console/console';
import { UserAuthExpireOverlay, UserLoader, UserLockOverlay } from '@wener/console/console/user';
import { WindowHost } from '@wener/console/web/window';
import { loadModule } from '@/console/loadModule';
import { UserActions } from '@/foundation/User/UserActions';
import { ConsoleLayout } from './components/ConsoleLayout';

export const ConsoleAppContent = () => {
  return (
    <UserLoader load={async () => (await UserActions.getCurrentUser()) as UserProfileData}>
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
        <Launcher.Host />
      </ConsoleLoader>
    </UserLoader>
  );
};

export default ConsoleAppContent;
