import type React, { ReactNode } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { Client } from '@urql/core';
import { getGraphQLUrl, getUrqlClient } from '@wener/console/client/graphql';
import { ConsoleLoader, getAccessToken, getSiteStore, Launcher, type UserProfileData } from '@wener/console/console';
import { UserAuthExpireOverlay, UserLoader, UserLockOverlay } from '@wener/console/console/user';
import { getAuthState } from '@wener/console/foundation/auth';
import { type LoginFormData } from '@wener/console/pages';
import { showErrorToast, showSuccessToast } from '@wener/console/toast';
import { createUrqlClient } from '@wener/console/urql';
import { WindowHost } from '@wener/console/window';
import { getGlobalStates } from '@wener/utils';
import { Provider as UrqlProvider } from 'urql';
import { ConsoleLayout } from '@/console/components/ConsoleLayout';
import { loadModule } from '@/console/loadModule';
import { ReactQueryClientProvider } from '@/console/ReactQueryClientProvider';
import { AuthActions } from '@/foundation/Auth/AuthActions';
import { UserActions } from '@/foundation/User/UserActions';
import schema from '@/gql/urql.schema.json' with { type: 'json' };
import { resolveResourceSchema } from '@/resource';
import type { RouteObjects } from '@wener/console/router';
import { RootRouterReactor } from '@wener/console/src/console/components/RootRouterReactor';
import { ErrorSuspenseBoundary } from '@wener/reaction';
import { Outlet } from 'react-router-dom';
import { NotFoundPage, PageErrorState } from '@wener/console/src/web';

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
	const { title } = getSiteStore().getState();
	return (
		<ReactQueryClientProvider>
			<ReactQueryDevtools initialIsOpen={false} />
			<UrqlProvider value={getUrqlClient()}>
				{/* fixme Change this */}
				<UserLoader load={async () => (await UserActions.getCurrentUser()) as UserProfileData}>
					<ConsoleLoader
						loadModule={loadModule}
						modules={[
							//
							'site.core',
							'user.core',
						]}
						render={(content) => {
							return <ConsoleLayout>{content}</ConsoleLayout>;
						}}
					>
						<UserAuthExpireOverlay />
						<UserLockOverlay />
						<WindowHost />
						<Launcher.Host />
					</ConsoleLoader>
				</UserLoader>
			</UrqlProvider>
		</ReactQueryClientProvider>
	);
};

function createRootRoutes({
	children,
	render = (children) => children,
}: {
	children: RouteObjects;
	render?: (content: ReactNode) => ReactNode;
}): RouteObjects {
	return [
		{
			element: (
				<>
					<RootRouterReactor />
					{render(
						<ErrorSuspenseBoundary>
							<Outlet />
						</ErrorSuspenseBoundary>,
					)}
				</>
			),
			errorElement: <PageErrorState />,
			handle: {
				title: getSiteStore().getState().title,
			},
			children: [
				...children,
				{
					path: '*',
					element: <NotFoundPage />,
				},
			],
		},
	];
}
