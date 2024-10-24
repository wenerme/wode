import { ConsoleEvents, getConsoleContext } from '@wener/console/console';
import { getAuthStore } from '@wener/console/foundation/auth';
import { defineInit } from '@/utils/init/defineInit';

export const InstanceInit = defineInit({
  name: 'Console',
  onInit: () => {
    const ctx = getConsoleContext();
    const emitter = ctx.getEmitter();
    const authStore = getAuthStore();

    ctx.getAccessToken = () => {
      return getAuthStore().getState().accessToken;
    };
    emitter.on(ConsoleEvents.SignOut, () => {
      authStore.getState().reset();
    });
  },
});
