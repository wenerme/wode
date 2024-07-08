import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getUrqlClient } from '@wener/console/client/graphql';
import { ComponentProvider } from '@wener/console/components';
import { AppActor, Authenticated, AuthReady, SiteLogo, StaticRootReactor } from '@wener/console/console';
import { ContextStoreProvider } from '@wener/console/hooks';
import { LoginFormData } from '@wener/console/pages';
import { AppActions, getAppStore } from '@wener/console/state';
import { showErrorToast, showSuccessToast } from '@wener/console/toast';
import { ErrorSuspenseBoundary, getConsoleContext } from '@wener/console/web';
import dayjs from 'dayjs';
import { Provider } from 'urql';
import { WenerLogo } from '@/demo/modules/site.core/WenerLogo';

const doPasswordLogin = async ({ username, password }: LoginFormData) => {
  if (username !== 'admin' || password !== 'admin') {
    throw new Error('用户名或密码错误');
  }
  return {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    expiresIn: 7200,
    expiresAt: dayjs().add(7200, 'second').toDate(),
  };
};

interface AccessTokenObject {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date | string;
}

interface AuthActions {
  signInByPassword: (data: { username: string; password: string }) => Promise<AccessTokenObject>;
  signOut: () => Promise<any>;
}

function getAuthActions(): AuthActions {
  return {
    signInByPassword: async (data) => {
      return doPasswordLogin(data);
    },
    signOut: async () => {},
  };
}

const doLogin = async (o: LoginFormData) => {
  let store = getAppStore();
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

function getAppActorActions(): AppActions {
  return {
    refresh: async ({ accessToken, refreshToken = '' }) => {
      return doPasswordLogin({ username: 'admin', password: 'admin' });
    },
    async ping() {},
  };
}

const ReactQueryClientProvider: React.FC<{ children?: React.ReactNode; url?: string }> = ({ children, url }) => {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 5 * 1000 } } }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const Content = React.lazy(async () => import('./ConsoleContent'));
// Content.displayName = 'Content';
export const ConsoleApp = () => {
  return (
    <>
      <ErrorSuspenseBoundary>
        <ComponentProvider
          components={[
            {
              provide: SiteLogo,
              Component: WenerLogo,
              // Component: withDefaultProps(ActiveToggleIcon, { icon: WenerLogo, inactiveClassName: 'opacity-75' }),
            },
          ]}
        >
          <StaticRootReactor />
          <AppActor actions={getAppActorActions()} />
          <AuthReady>
            <ReactQueryClientProvider>
              <Provider value={getUrqlClient()}>
                <ContextStoreProvider value={getConsoleContext().getModuleService().store}>
                  <Authenticated onLogin={doLogin}>
                    <Content />
                  </Authenticated>
                </ContextStoreProvider>
              </Provider>
            </ReactQueryClientProvider>
          </AuthReady>
        </ComponentProvider>
      </ErrorSuspenseBoundary>
    </>
  );
};
