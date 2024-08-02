import { AppActions } from '@/console';
import { doPasswordLogin } from '@/demo/getAuthActions';

export function getAppActorActions(): AppActions {
  return {
    refresh: async ({ accessToken, refreshToken = '' }) => {
      return doPasswordLogin({ username: 'admin', password: 'admin' });
    },
    async ping() {},
  };
}
