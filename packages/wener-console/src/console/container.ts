import {
  asFunction,
  createContainer,
  InjectionMode,
  type AwilixContainer,
  type NameAndRegistrationPair,
} from 'awilix/browser';
import { getGraphQLUrl } from '../client/graphql';
import { getLogger } from '../hooks';
import { createAppStore, getGlobalStates, setGlobalStates, type AppState, type AppStore } from '../state';
import { showSuccessToast } from '../toast';
import type { DynamicModule } from '../web';
import { clearAuthToken } from './AppActor';
import { Launcher } from './ConsoleLauncher';
import type { LauncherStore } from './ConsoleLauncher/Launcher';
import { createConsoleStore, type ConsoleStore, type ConsoleStoreState } from './store/ConsoleStore';
import { createRouteStore, type RouteStore } from './store/RouteStore';
import { createUserStore, type UserState, type UserStore } from './store/UserStore';
import type { UserAction } from './user/getUserAction';

type ConsoleContext2 = {
  getAccessToken: () => string | undefined;
  loadModule: (name: string) => Promise<DynamicModule>;
};

export type ConsoleContext = {
  appStore: AppStore;
  appState: AppState;

  consoleStore: ConsoleStore;
  consoleState: ConsoleStoreState;

  userStore: UserStore;
  userState: UserState;

  userAction: UserAction;

  launcherStore: LauncherStore;
  launcherState: ReturnType<LauncherStore['getState']>;

  routeStore: RouteStore;
  routeState: ReturnType<RouteStore['getState']>;

  accessToken: string | undefined;
  graphqlUrl: string;

  loadModule: (name: string) => Promise<DynamicModule>;
};

const GlobalStateKey = 'ConsoleContainer';

export function setConsoleContainer(container: AwilixContainer) {
  setGlobalStates(GlobalStateKey, container);
}

export function getConsoleContainer<T extends object = ConsoleContext>(
  creator?: () => AwilixContainer<T>,
): AwilixContainer<T> {
  creator ||= createConsoleContainer as () => AwilixContainer<T>;
  return getGlobalStates(GlobalStateKey, creator);
}

export function getConsoleContext() {
  return getConsoleContainer<ConsoleContext>().cradle;
}

// export function createXContainer<T extends ConsoleContext = ConsoleContext>(): {
//   container: AwilixContainer<T>;
//   getContext: () => T;
//   getContainer: () => AwilixContainer<T>;
// } {
//   type C = AwilixContainer<T>;
//   let container = getConsoleContainer(() => createConsoleContainer({})) as C;
//   return {
//     container,
//     getContext: () => container.cradle,
//     getContainer: () => container,
//   };
// }

export function createConsoleContainer<T extends ConsoleContext = ConsoleContext>(reg: NameAndRegistrationPair<T>) {
  const container = createContainer<ConsoleContext>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    appStore: asFunction(() => createAppStore()).singleton(),
    appState: asFunction(({ appStore }) => {
      return appStore.getState();
    }),
    accessToken: asFunction(({ appState }) => {
      return appState.auth.accessToken;
    }),

    consoleStore: asFunction(() => {
      return createConsoleStore();
    }).singleton(),
    consoleState: asFunction(({ consoleStore }) => {
      return consoleStore.getState();
    }),

    userStore: asFunction(() => createUserStore()).singleton(),
    userState: asFunction(({ userStore }) => {
      return userStore.getState();
    }),
    userAction: asFunction(createFakeUserAction).singleton(),

    launcherStore: asFunction(Launcher.getStore).singleton(),
    launcherState: asFunction(({ launcherStore }) => {
      return launcherStore.getState();
    }),

    routeStore: asFunction(() => createRouteStore()).singleton(),
    routeState: asFunction(({ routeStore }) => {
      return routeStore.getState();
    }),

    graphqlUrl: asFunction(getGraphQLUrl),

    loadModule: asFunction(() => {
      return (name: string) => {
        throw new Error(`failed load module ${name}: Not implemented`);
      };
    }).singleton(),
    ...reg,
  });

  return container as AwilixContainer<T>;
}

export function getAccessToken() {
  return getConsoleContext().accessToken;
}

export function getAppState(): AppState {
  return getConsoleContext().appState;
}

export function getAppStore(): AppStore {
  return getConsoleContext().appStore;
}

/**
 * @deprecated
 */
export function getLauncherStore() {
  return Launcher.getStore();
}

export function getRouteStore(): RouteStore {
  return getConsoleContext().routeStore;
}

export function getConsoleStore(): ConsoleStore {
  return getConsoleContext().consoleStore;
}

export function getUserStore(): UserStore {
  return getConsoleContext().userStore;
}

export function getUserState(): UserState {
  return getConsoleContext().userState;
}

function createFakeUserAction(): UserAction {
  const log = getLogger('UserAction');

  return {
    refreshProfile: () => {
      showSuccessToast('UserAction: refreshProfile');
    },
    lock: () => {
      getConsoleStore().setState({ locked: true });
    },
    unlock: (opts) => {
      getConsoleStore().getState().unlock(opts);
    },
    signOut: async () => {
      getAppState().logout();
      clearAuthToken();
    },
    signIn: async () => {
      showSuccessToast('FAKE sign in');

      getAppState().setAuth({
        accessToken: 'FAKE',
      });

      getUserStore()
        .getState()
        .load({
          id: 'usr_1',
          displayName: 'Wener',
          fullName: '文儿',
          loginName: 'wenerme',
          photoUrl: '',
          email: 'wener@wener.me',
          roles: [
            {
              id: 'ro_1',
              code: 'admin',
              title: 'Admin',
            },
          ],
        });
    },
  };
}
