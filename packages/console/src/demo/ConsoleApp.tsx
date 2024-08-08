import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getUrqlClient } from '@wener/console/client/graphql';
import { ComponentProvider } from '@wener/console/components';
import {
  AppActor,
  AppConfLoader,
  Authenticated,
  AuthReady,
  getAppStore,
  SiteLogo,
  StaticRootReactor,
} from '@wener/console/console';
import { ContextStoreProvider } from '@wener/console/hooks';
import { LoginFormData } from '@wener/console/pages';
import { showErrorToast, showSuccessToast } from '@wener/console/toast';
import { ErrorSuspenseBoundary, getConsoleContext } from '@wener/console/web';
import { Provider } from 'urql';
import { UserProfileData } from '../console/store/UserStore';
import { UserLoader } from '../console/user';
import { getAppActorActions } from './getAppActorActions';
import { getAuthActions } from './getAuthActions';
import { WenerLogo } from './modules/site.core/WenerLogo';

const doLogin = async (o: LoginFormData) => {
  let store = getAppStore();
  try {
    const { signInByPassword } = getAuthActions();
    const out = await signInByPassword(o);
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
          <AppConfLoader load={async () => ({})}>
            <AppActor actions={getAppActorActions()} />
            <AuthReady>
              <ReactQueryClientProvider>
                <Provider value={getUrqlClient()}>
                  <UserLoader
                    load={async () => {
                      return {
                        id: 'usr_1',
                        displayName: 'Wener',
                        fullName: '文儿',
                        loginName: 'wenerme',
                        photoUrl: '',
                        email: 'wener@wener.me',
                        roles: [
                          {
                            id: 'ro_1',
                            code: 'admin',
                            title: 'Admin',
                          },
                        ],
                      } as UserProfileData;
                    }}
                  >
                    <ContextStoreProvider value={getConsoleContext().getModuleService().store}>
                      <Authenticated onLogin={doLogin}>
                        <Content />
                      </Authenticated>
                    </ContextStoreProvider>
                  </UserLoader>
                </Provider>
              </ReactQueryClientProvider>
            </AuthReady>
          </AppConfLoader>
        </ComponentProvider>
      </ErrorSuspenseBoundary>
    </>
  );
};
