import { createMemoryRouter, RouteObject } from 'react-router-dom';
import { Router } from '@remix-run/router';
import { mutative } from '@wener/reaction/mutative/zustand';
import { computeIfAbsent } from '@wener/utils';
import { createStore } from 'zustand';
import { LoadingIndicator } from '@/console';
import { getGlobalStates } from '@/state/getGlobalStates';

interface RouteState {
  // content
  routes: RouteObject[];
  // root router
  router: Router;
  // history: RemixHistory;
}

function createRouteStore() {
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

type RouteStore = ReturnType<typeof createRouteStore>;

export function getRootRouteStore(): RouteStore {
  return computeIfAbsent(getGlobalStates(), 'RootRouteStore', createRouteStore);
}
