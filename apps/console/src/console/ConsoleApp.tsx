import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getUrqlClient } from '@wener/console/client/graphql';
import { ConsoleLoader, Launcher, type UserProfileData } from '@wener/console/console';
import {
	AuthExpireOverlay as UserAuthExpireOverlay,
	UserLoader,
	AuthLockOverlay as UserLockOverlay,
} from '@wener/console/console/user';
import { WindowHost } from '@wener/console/window';
import { Provider as UrqlProvider } from 'urql';
import { ConsoleLayout } from '#/console/components/ConsoleLayout';
import { loadModule } from '#/console/loadModule';
import { ReactQueryClientProvider } from '#/console/ReactQueryClientProvider';
import { UserActions } from '#/foundation/User/UserActions';

export const ConsoleApp = () => {
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
