import { proxyWithCompare } from '../../valtio';

export interface UserSessionState {
  authed: boolean;
  expired: boolean;
  locked: boolean;
}

export function getUserSessionState(): UserSessionState {
  // eslint-disable-next-line no-return-assign
  return ((globalThis as any).__UserSessionState__ ||= proxyWithCompare({
    authed: false,
    expired: false,
    locked: false,
  }));
}
