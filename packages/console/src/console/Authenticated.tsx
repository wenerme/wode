import React, { PropsWithChildren, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import Splash from '@/assets/LoginSplash.jpg';
import { getAppState, getAppStore } from '@/console/container';
import { LoginFormData, LoginPage } from '@/console/pages/LoginPage';
import { AuthStatus } from '@/state';
import { SiteLogo } from '@/web';
import { Image } from '@/web/components/Image';

export const Authenticated: React.FC<
  PropsWithChildren & {
    onLogin?: (o: LoginFormData) => void;
  }
> = ({ children, onLogin }) => {
  const [authed, setAuthed] = useState(() => {
    return getAppState().auth.status === AuthStatus.Authenticated;
  });

  useEffect(() => {
    // if (authed) return;
    let store = getAppStore();
    let unsub = store.subscribe((s) => {
      if (s.auth.status === AuthStatus.Authenticated) {
        setAuthed(true);
      } else if (s.auth.status === AuthStatus.Unauthenticated) {
        setAuthed(false);
      }
    });
    return unsub;
  }, []);

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
    return <Auth onLogin={onLogin} />;
  }
  return <>{children}</>;
};

const Auth: React.FC<{ onLogin?: (o: LoginFormData) => void }> = ({ onLogin }) => {
  const { title } = getAppState();
  return (
    <LoginPage
      title={title}
      logo={<SiteLogo className={'h-10 w-10'} />}
      showRegistry={false}
      onSubmit={onLogin}
      showoff={
        // <img src={Splash} alt='splash' className='absolute inset-0 h-full w-full object-cover' />
        <Image
          className='absolute inset-0 h-full w-full object-cover'
          // https://images.unsplash.com/photo-1496917756835-20cb06e75b4e
          // src={'/static/login-splash.jpg'}
          src={Splash}
          // src={'https://images.unsplash.com/photo-1496917756835-20cb06e75b4e'}
          alt={'splash'}
        />
      }
    />
  );
};
