import React, { lazy } from 'react';
import ReactDOM from 'react-dom/client';
import type { BuildInfo } from '@wener/console/buildinfo';
import { ComponentProvider, Image, ProdOnly, UpdateNotification, WebVitals } from '@wener/console/components';
import { ErrorSuspenseBoundary, SiteLogo } from '@wener/console/console';
import { AuthBlock, AuthSidecar } from '@wener/console/foundation/auth';
import { SiteLoader, SiteSidecar } from '@wener/console/foundation/site';
import Splash from '@/assets/LoginSplash.jpg';
import { EnvironmentInit } from '@/console/EnvironmentInit';
import { LibInit } from '@/console/LibInit';
import { RootContext } from '@/console/RootContext';
import { AuthActions } from '@/foundation/Auth/AuthActions';
import { SiteActions } from '@/foundation/Site/SiteActions';
import { InstanceInit } from '@/instance/instance.init';
import { WenerLogo } from '@/instance/WenerLogo';
import { LoginPage } from '../../../../packages/wener-console/src/pages';
import './globals.css';

const ConsoleApp = lazy(() => import('./ConsoleApp').then(({ ConsoleApp }) => ({ default: ConsoleApp })));
ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<RootContext init={[EnvironmentInit, LibInit, InstanceInit]}>
			<ComponentProvider components={[{ provide: SiteLogo, Component: WenerLogo }]}>
				<SiteLoader
					getSiteConf={async () => {
						return (await SiteActions.resolveSiteConf({})) ?? {};
					}}
				>
					<SiteSidecar />
					<AuthSidecar
						actions={{
							refresh: AuthActions.refreshAccessToken,
						}}
					/>
					<AuthBlock
						fallback={
							<LoginPage
								title={''}
								logo={<SiteLogo className={'h-10 w-10'} />}
								onSubmit={() => {
									// todo
								}}
								hero={<Image className='absolute inset-0 h-full w-full object-cover' src={Splash} alt={'splash'} />}
							/>
						}
					>
						<ErrorSuspenseBoundary>
							<ConsoleApp />
						</ErrorSuspenseBoundary>
					</AuthBlock>
				</SiteLoader>
			</ComponentProvider>
		</RootContext>
		<ProdOnly>
			<UpdateNotification
				getVersion={async () => {
					const res = await fetch('/version.json');
					const data: BuildInfo = await res.json();
					return data.date || data.version;
				}}
			/>
			<WebVitals />
		</ProdOnly>
	</React.StrictMode>,
);
