import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getUrqlClient } from '@wener/console/client/graphql';
import { ComponentProvider } from '@wener/console/components';
import { AppActor, AppConfLoader, Authenticated, AuthReady, SiteLogo, StaticRootReactor } from '@wener/console/console';
import { ContextStoreProvider } from '@wener/console/hooks';
import { LoginFormData } from '@wener/console/pages';
import { getAppStore } from '@wener/console/state';
import { showErrorToast, showSuccessToast } from '@wener/console/toast';
import { ErrorSuspenseBoundary, getConsoleContext } from '@wener/console/web';
import { Provider } from 'urql';
import { getAppActorActions } from '@/demo/getAppActorActions';
import { getAuthActions } from '@/demo/getAuthActions';
import { WenerLogo } from '@/demo/modules/site.core/WenerLogo';

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
                  <ContextStoreProvider value={getConsoleContext().getModuleService().store}>
                    <Authenticated onLogin={doLogin}>
                      <Content />
                    </Authenticated>
                  </ContextStoreProvider>
                </Provider>
              </ReactQueryClientProvider>
            </AuthReady>
          </AppConfLoader>
        </ComponentProvider>
      </ErrorSuspenseBoundary>
    </>
  );
};
