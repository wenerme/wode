'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import ConsoleApp from '../demo/ConsoleApp';
import { showErrorToast, showSuccessToast } from '../toast';
import { AppGlobalActor, getAppGlobalStore } from '../web/AppGlobalActor';
import { LoginFormData } from '../web/pages';
import { AuthenticatedOnce } from './AuthenticatedOnce';
import { doPasswordLogin, doPing, doRefreshToken } from './actions';

export default function () {
  const doLogin = async (o: LoginFormData) => {
    let store = getAppGlobalStore();
    try {
      const out = await doPasswordLogin(o);
      store.getState().setAuth({
        accessToken: out.accessToken,
        refreshToken: out.refreshToken,
        expiresIn: out.expiresIn,
        expiresAt: out.expiresAt,
      });
      showSuccessToast('登录成功');
    } catch (e) {
      showErrorToast(e);
    }
  };

  return (
    <>
      <AppGlobalActor
        actions={{
          refresh: doRefreshToken,
          ping: doPing,
        }}
      />
      <AuthenticatedOnce onLogin={doLogin}>
        <ConsoleApp />
      </AuthenticatedOnce>
    </>
  );
}
