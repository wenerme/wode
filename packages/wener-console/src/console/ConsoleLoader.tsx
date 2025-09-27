import React, { useState, type FC, type ReactNode } from 'react';
import { createHashRouter, Outlet, RouterProvider } from 'react-router-dom';
import { ErrorSuspenseBoundary, useAsyncEffect, useDebugRender } from '@wener/reaction';
import { useStore } from 'zustand';
import { isDev } from '../const';
import { useLogger } from '../hooks';
import type { RouteObjects } from '../router';
import { getConsoleContext, NotFoundPage, PageErrorState, type DynamicModule } from '../web';
import { LoadingIndicator } from './components';
import { RootRouterReactor } from './components/RootRouterReactor';
import { getRouteStore, getSiteStore } from './context';
import type { ReactRouter } from './store/RouteStore';

enum ServiceState {
	New = 'New',
	Pending = 'Pending',
	Done = 'Done',
	Error = 'Error',
}

let _state = ServiceState.New;

export type ConsoleLoaderProps = {
	/**
	 * Render root content
	 * @param content
	 */
	render?: (content: ReactNode) => ReactNode;
	loadModule: (name: string) => Promise<DynamicModule>;
	modules?: string[];
	children?: ReactNode;
	createRouter?: (children: RouteObjects) => ReactRouter;
};

export const ConsoleLoader: FC<ConsoleLoaderProps> = ({
	loadModule,
	modules = [],
	render,
	createRouter = createHashRouter,
	children,
}) => {
	const router = useStore(getRouteStore(), ({ router }) => router);
	useDebugRender(`ConsoleAppContent`);
	const log = useLogger('ConsoleContent');
	const [state, _setState] = useState(ServiceState.New);

	const setState = (s: ServiceState) => {
		// fixme avoid restrict mode rerender
		_state = s;
		_setState(s);
	};

	useAsyncEffect(async () => {
		if (_state !== 'New') {
			log(`Skip reinit APP`);
			return;
		}
		log('Initializing');
		setState(ServiceState.Pending);

		const moduleService = getConsoleContext().getModuleService();
		moduleService.loader = loadModule;

		try {
			log(`Load modules: ${modules.join(', ')}`);
			await moduleService.loadModules(modules);
			if (isDev()) {
				console.log(`Loaded`, moduleService.modules);
			}
		} catch (e) {
			console.error('load module failed', e);
			setState(ServiceState.Error);
			return;
		}

		const routes: RouteObjects = await moduleService.createRoutes();
		const router = createRouter(
			createRootRoutes({
				children: routes,
				render,
			}),
		);
		getRouteStore().setState({ router: router as any, routes });
		setState(ServiceState.Done);
		log('Initialized');

		if (isDev()) {
			log(`Final Store`, moduleService.store.getState());
		}
	}, [state]);

	if (!router) {
		log(`Router not ready: ${state}`);
		return <LoadingIndicator />;
	}
	return (
		<>
			{children}
			<RouterProvider router={router} />
		</>
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
