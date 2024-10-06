export { getGlobalStates } from '../state';

export { StaticRootReactor } from './components/StaticRootReactor';
export { ModuleMainLayout } from './components/ModuleMainLayout';
export {
  type SiteLogoProps,
  SiteLogo,
  type LinkProps,
  Link,
  type LoadingIndicatorProps,
  LoadingIndicator,
  type EmptyPlaceholderProps,
  EmptyPlaceholder,
  type ImageProps,
  Image,
  type ErrorSuspenseBoundaryProps,
  ErrorSuspenseBoundary,
} from './components/ConsoleComponent';
export { defineApplet, getApplets, type DefineAppletOptions } from './applets/defineApplet';
export { Authenticated } from './Authenticated';
export { AppActor, AuthReady, type AppActions } from './AppActor';
export { AppConfLoader } from './AppConfLoader';
export { ConsoleLoader, type ConsoleLoaderProps } from './ConsoleLoader';
export { ConsoleLauncher, type ConsoleLauncherProps } from './ConsoleLauncher';
export { useUserPreferenceState } from './hooks';
export {
  createConsoleContainer,
  getConsoleContainer,
  getConsoleContext,
  setConsoleContainer,
  //
  getAppStore,
  getAccessToken,
  getRouteStore,
  getLauncherStore,
  getAppState,
  getConsoleStore,
  getUserStore,
  getUserState,
  type ConsoleContext,
} from './container';

export { type AppStore, type AppState, type AuthStatus, createAppStore } from '../state/AppStore';
export { type UserStore, type UserState, type UserProfileData, createUserStore } from './store/UserStore';
export { type RouteStore, type RouteState, createRouteStore } from './store/RouteStore';

export { Launcher } from './ConsoleLauncher/Launcher';
