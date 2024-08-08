import { createMemoryRouter, RouteObject } from 'react-router-dom';
import { Router } from '@remix-run/router';
import { mutative } from '@wener/reaction/mutative/zustand';
import { createStore } from 'zustand';
import { LoadingIndicator } from '../components';

export interface RouteState {
  // content
  routes: RouteObject[];
  // root router
  router: Router;
  // history: RemixHistory;
}

export function createRouteStore() {
  return createStore(
    mutative<RouteState>((setState, getState, store) => {
      const router = createMemoryRouter([
        {
          index: true,
          element: <LoadingIndicator />,
        },
      ]);
      return {
        routes: [],
        router,
        // history,
      } as RouteState;
    }),
  );
}

export type RouteStore = ReturnType<typeof createRouteStore>;
