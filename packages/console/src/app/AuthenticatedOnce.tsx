import React, { PropsWithChildren, useEffect, useState } from 'react';
import Image from 'next/image';
import { getAppGlobalStore } from '../web/AppGlobalActor';
import { LoginFormData, LoginPage } from '../web/pages';
import Splash from './LoginSplash.jpg';

export const AuthenticatedOnce: React.FC<PropsWithChildren & { onLogin?: (o: LoginFormData) => void }> = ({
  children,
  onLogin,
}) => {
  const [authed, setAuthed] = useState(false);
  let store = getAppGlobalStore();
  useEffect(() => {
    return store.subscribe((s) => {
      if (!authed || s.auth.status === 'authenticated') {
        setAuthed(true);
      }
    });
  }, [store]);

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
