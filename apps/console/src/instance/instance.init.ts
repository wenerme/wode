import { asFunction } from 'awilix/browser';
import { getContainer } from '@/console/context';
import { getAuthStore } from '@/foundation/Auth/AuthStore';
import { defineInit } from '@/utils/init/defineInit';

export const InstanceInit = defineInit({
  name: 'Console',
  onInit: () => {
    let container = getContainer();
    container.register({
      accessToken: asFunction(() => {
        return getAuthStore().getState().accessToken;
      }),
    });
    {
      let ua = container.resolve('userAction');
      Object.assign(ua, {
        singOut: () => {
          getAuthStore().getState().reset();
        },
      });
    }
  },
});
