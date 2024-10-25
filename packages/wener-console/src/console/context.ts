import { getGlobalStates, setGlobalStates } from '@wener/utils';
import Emittery from 'emittery';
import { useStore } from 'zustand';
import { getSiteStore as _getSiteStore, type SiteStore } from '../foundation/site/SiteStore';
import { createRouteStore, type RouteStore } from './store/RouteStore';
import { createUserStore, type UserStore } from './store/UserStore';

// IoC, DI is not the goal, just need a global context

export type ConsoleContext = {
  getAccessToken: () => string | undefined;
  useUserId: () => string | undefined;
  getEmitter: () => ConsoleEmitter;
  getRouteStore: () => RouteStore;
  getSiteStore: () => SiteStore;
  getUserStore: () => UserStore;
};

export const ConsoleEvents = {
  Error: 'Console:Error',
  SignIn: 'Console:SignIn',
  SignOut: 'Console:SignOut',
  Lock: 'Console:Lock',
  Unlock: 'Console:Unlock',
  RefreshProfile: 'Console:RefreshProfile',
  ModuleLoad: 'Console:Module:Load',
  LauncherToggle: 'Console:Launcher:Toggle',
} as const;

type ConsoleEventData = {
  [ConsoleEvents.Error]: ConsoleEvent<{ error: any }>;
  [ConsoleEvents.SignIn]: ConsoleEvent<{}>;
  [ConsoleEvents.SignOut]: ConsoleEvent<{}>;
  [ConsoleEvents.Lock]: ConsoleEvent<{}>;
  [ConsoleEvents.Unlock]: ConsoleEvent<{ pin?: string }>;
  [ConsoleEvents.RefreshProfile]: ConsoleEvent<{}>;
  [ConsoleEvents.ModuleLoad]: ConsoleEvent<{ module: any }>;
  [ConsoleEvents.LauncherToggle]: ConsoleEvent<{ open?: boolean }>;
};
type ConsoleEvent<T> = T;
type ConsoleEmitter = Emittery<ConsoleEventData>;

function createConsoleContext({ emitter: _emitter }: { emitter?: Emittery }) {
  const emitter = (_emitter || new Emittery<ConsoleEventData>()) as ConsoleEmitter;
  const routeStore = createRouteStore();
  const userStore = createUserStore();
  const ctx: ConsoleContext = {
    getAccessToken: () => undefined,
    getEmitter: () => emitter,
    getRouteStore: () => routeStore,
    getSiteStore: _getSiteStore,
    getUserStore: () => userStore,
    useUserId: () => useStore(getUserStore(), (s) => s.id),
  };
  return {
    emitter,
    context: ctx,
  };
}

const ConsoleContextKey = 'ConsoleContext';

export function getConsoleContext(): ConsoleContext {
  return getGlobalStates(ConsoleContextKey, () => {
    return createConsoleContext({}).context;
  });
}

export function setConsoleContext(context: ConsoleContext) {
  setGlobalStates(ConsoleContextKey, context);
}

export function getAccessToken() {
  return getConsoleContext().getAccessToken();
}

export function useUserId() {
  return getConsoleContext().useUserId();
}

export function getRouteStore(): RouteStore {
  return getConsoleContext().getRouteStore();
}

export function getSiteStore(): SiteStore {
  return getConsoleContext().getSiteStore();
}

export function getUserStore(): UserStore {
  return getConsoleContext().getUserStore();
}

export function getConsoleEmitter() {
  return getConsoleContext().getEmitter();
}
