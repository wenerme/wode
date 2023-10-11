'use client';

import React from 'react';
import Image from 'next/image';
import { LoginFormData, LoginPage } from '../components/console/pages/LoginPage';
import { showErrorToast, showSuccessToast } from '../components/toast';
import Splash from './LoginSplash.jpg';
import { doPasswordLogin } from './actions';

export default function () {
  const doLogin = async (o: LoginFormData) => {
    try {
      const { message } = await doPasswordLogin(o);
      showSuccessToast(message);
    } catch (e) {
      showErrorToast(e);
    }
  };
  return (
    <LoginPage
      onSubmit={doLogin}
      showoof={
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
