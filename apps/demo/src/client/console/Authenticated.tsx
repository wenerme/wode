import React, { PropsWithChildren } from 'react';
import { getUserSessionState } from '@wener/console/console/user';
import { LoginPage } from '@wener/console/pages';
import { LoginFormData } from '@wener/console/pages';
import Image from 'next/image';
import { useSnapshot } from 'valtio';
import Splash from './LoginSplash.jpg';

export const Authenticated: React.FC<PropsWithChildren & { onLogin?: (o: LoginFormData) => void }> = ({
  children,
  onLogin,
}) => {
  const state = getUserSessionState();
  const { authed } = useSnapshot(state);

  // useAsyncEffect(async () => {
  //   try {
  //     await setup();
  //     setState({ init: true });
  //   } catch (e) {
  //     showErrorToast(e);
  //   }
  // }, []);
  // if (!init) {
  //   return <LoadingIndicator />;
  // }

  if (!authed) {
    return (
      <LoginPage
        onSubmit={onLogin}
        showoff={
          <Image
            className='absolute inset-0 h-full w-full object-cover'
            // https://images.unsplash.com/photo-1496917756835-20cb06e75b4e
            // src={'/static/login-splash.jpg'}
            src={Splash}
            alt={'splash'}
          />
        }
      />
    );
  }
  return <>{children}</>;
};
