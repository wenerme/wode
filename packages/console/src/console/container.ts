import { asFunction, AwilixContainer, createContainer, InjectionMode } from 'awilix';
import { getGraphQLUrl } from '../client/graphql';
import { getLogger } from '../hooks';
import { AppState, AppStore, createAppStore, getGlobalStates } from '../state';
import { showSuccessToast } from '../toast';
import { DynamicModule } from '../web';
import { clearAuthToken } from './AppActor';
import { createLauncherStore, LauncherStore } from './ConsoleLauncher/LauncherStore';
import { ConsoleStore, createConsoleStore } from './ConsoleStore';
import { createRouteStore, RouteStore } from './RouteStore';
import { UserAction } from './user/getUserAction';
import { createUserStore, UserStore } from './UserStore';

export type ConsoleContext = {
  appStore: AppStore;
  appState: ReturnType<AppStore['getState']>;

  consoleStore: ConsoleStore;
  consoleState: ReturnType<ConsoleStore['getState']>;

  userStore: UserStore;
  userState: ReturnType<UserStore['getState']>;

  userAction: UserAction;

  launcherStore: LauncherStore;
  launcherState: ReturnType<LauncherStore['getState']>;

  routeStore: RouteStore;
  routeState: ReturnType<RouteStore['getState']>;

  accessToken: string | undefined;
  graphqlUrl: string;

  loadModule: (name: string) => Promise<DynamicModule>;
};

export function setConsoleContainer(container: AwilixContainer) {
  getGlobalStates()['ConsoleContainer'] = container;
}

export function getConsoleContainer<T extends object = ConsoleContext>(creator?: () => AwilixContainer<T>) {
  creator ||= createConsoleContainer as () => AwilixContainer<T>;
  return getGlobalStates('ConsoleContainer', creator);
}

export function getConsoleContext() {
  return getConsoleContainer<ConsoleContext>().cradle;
}

export function createConsoleContainer() {
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

    launcherStore: asFunction(() => createLauncherStore()).singleton(),
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
  });

  return container;
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

export function getLauncherStore() {
  return getConsoleContext().launcherStore;
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
