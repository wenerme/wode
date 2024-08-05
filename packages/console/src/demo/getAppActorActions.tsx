import { AppActions } from '../console';
import { doPasswordLogin } from './getAuthActions';

export function getAppActorActions(): AppActions {
  return {
    refresh: async ({ accessToken, refreshToken = '' }) => {
      return doPasswordLogin({ username: 'admin', password: 'admin' });
    },
    async ping() {},
  };
}
