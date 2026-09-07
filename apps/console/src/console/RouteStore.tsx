import { LoadingIndicator } from '@wener/console/loader';
import React from 'react';
import { createMemoryRouter, type RouteObject } from 'react-router';
import { createStore } from 'zustand';
import { mutative } from 'zustand-mutative';

type ReactRouter = ReturnType<typeof createMemoryRouter>;

interface RouteState {
	// content
	routes: RouteObject[];
	// root router
	router: ReactRouter;
	// history: RemixHistory;
}

export function createRouteStore(initial: Partial<RouteState> = {}) {
	return createStore(
		mutative<RouteState>(() => {
			const routes = initial.routes ?? [
				{
					index: true,
					element: <LoadingIndicator />,
				},
			];
			const router = createMemoryRouter(routes);
			return {
				routes,
				router,
				// history,
			} as RouteState;
		}),
	);
}
