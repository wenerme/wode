import { createMemoryRouter, type RouteObject } from 'react-router';
import { createReactContext } from '@wener/reaction';
import { createStore } from 'zustand';
import { mutative } from 'zustand-mutative';
import { LoadingIndicator } from '../components';

export type ReactRouter = ReturnType<typeof createMemoryRouter>;
export interface RouteState {
	// content
	routes: RouteObject[];
	// root router
	router: ReactRouter;
	// history: RemixHistory;
}

export function createRouteStore() {
	return createStore(
		mutative<RouteState>((_setState, _getState, _store) => {
			const router: ReactRouter = createMemoryRouter([
				{
					index: true,
					element: <LoadingIndicator />,
				},
			]);
			return {
				routes: [],
				router,
			} as RouteState;
		}),
	);
}

export type RouteStore = ReturnType<typeof createRouteStore>;

const _RouterStoreContext = createReactContext<ReactRouter | undefined>('RouterStoreContext', undefined);
