import { proxyWith } from '../../components/valtio';

export interface UserSessionState {
  token?: string;
  authed: boolean;
  expired: boolean;
  locked: boolean;
}

export function getUserSessionState(): UserSessionState {
  return proxyWith({
    name: 'UserSessionState',
    global: true,
    broadcast: true,
    storage: globalThis.sessionStorage,
    initialState: {
      authed: false,
      expired: false,
      locked: false,
    },
  });
}
