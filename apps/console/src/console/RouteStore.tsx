import { createMemoryRouter, type RouteObject } from 'react-router-dom';
import type { Router } from '@remix-run/router';
import { LoadingIndicator } from '@wener/console/loader';
import { createStore } from 'zustand';
import { mutative } from 'zustand-mutative';

interface RouteState {
  // content
  routes: RouteObject[];
  // root router
  router: Router;
  // history: RemixHistory;
}

function createRouteStore(initial: Partial<RouteState> = {}) {
  return createStore(
    mutative<RouteState>((setState, getState, store) => {
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

type RouteStore = ReturnType<typeof createRouteStore>;
