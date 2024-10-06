import type React from 'react';
import { lazy, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Client } from '@urql/core';
import { getGraphQLUrl } from '@wener/console/client/graphql';
import { ComponentProvider } from '@wener/console/components';
import { ErrorSuspenseBoundary, getAccessToken, SiteLogo } from '@wener/console/console';
import { createUrqlClient } from '@wener/console/urql';
import { getGlobalStates } from '@wener/utils';
import { Provider as UrqlProvider } from 'urql';
import { AuthActions } from '@/foundation/Auth/AuthActions';
import { AuthBlock } from '@/foundation/Auth/AuthBlock';
import { AuthReady } from '@/foundation/Auth/AuthReady';
import { AuthSidecar, getAuthState } from '@/foundation/Auth/AuthStore';
import schema from '@/gql/urql.schema.json' with { type: 'json' };
import { WenerLogo } from '@/instance/WenerLogo';
import { resolveResourceSchema } from '@/resource';
import './globals.css';
import { ContextStoreProvider } from '@wener/console/hooks';
import { LoginPage, type LoginFormData } from '@wener/console/pages';
import { showErrorToast, showSuccessToast } from '@wener/console/toast';
import { getConsoleContext, Image } from '@wener/console/web';
import Splash from '@/assets/LoginSplash.jpg';
import { getSiteState } from '@/foundation/Site/SiteStore';
import { Instance } from '@/instance/Instance';

const Content = lazy(() => import('./ConsoleAppContent'));

export const ConsoleApp = () => {
  const doLogin = async (o: LoginFormData) => {
    try {
      const out = await AuthActions.signInByPassword({
        ...o,
      });
      getAuthState().setAuth(out);
      showSuccessToast('登录成功');
      // if (await refreshProfile()) {
      //   showSuccessToast(message || '登录成功');
      // } else {
      //   showErrorToast('登录检测失败');
      // }
    } catch (e) {
      showErrorToast(e);
    }
  };
  const { title } = getSiteState();
  return (
    <Instance.Provide>
      <ComponentProvider components={[{ provide: SiteLogo, Component: WenerLogo }]}>
        <AuthSidecar
          actions={{
            refresh: AuthActions.refreshAccessToken,
          }}
        />
        <AuthReady>
          <ReactQueryClientProvider>
            <UrqlProvider value={getUrqlClient()}>
              {/* fixme Change this */}
              <ContextStoreProvider value={getConsoleContext().getModuleService().store}>
                <AuthBlock
                  fallback={
                    <LoginPage
                      title={title}
                      logo={<SiteLogo className={'h-10 w-10'} />}
                      onSubmit={doLogin}
                      hero={
                        <Image className='absolute inset-0 h-full w-full object-cover' src={Splash} alt={'splash'} />
                      }
                    />
                  }
                >
                  <ErrorSuspenseBoundary>
                    <Content />
                  </ErrorSuspenseBoundary>
                </AuthBlock>
              </ContextStoreProvider>
            </UrqlProvider>
          </ReactQueryClientProvider>
        </AuthReady>
      </ComponentProvider>
    </Instance.Provide>
  );
};

function getUrqlClient(): Client {
  return getGlobalStates('UrqlClient', () =>
    createUrqlClient({
      getToken: getAccessToken,
      url: getGraphQLUrl(),
      schema,
      resolveTypeNameFromKey: (id) => {
        return resolveResourceSchema({ id })?.typeName;
      },
    }),
  );
}

const ReactQueryClientProvider: React.FC<{ children?: React.ReactNode; url?: string }> = ({ children, url }) => {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 5 * 1000 } } }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
