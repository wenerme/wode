import { defineInit } from '@wener/common/meta';
import { ConsoleEventType, getConsoleContext } from '@wener/console/console';
import { getAuthStore } from '@wener/console/foundation/auth';

export const InstanceInit = defineInit({
	name: 'Console',
	onInit: () => {
		const ctx = getConsoleContext();
		const emitter = ctx.getEmitter();
		const authStore = getAuthStore();

		ctx.getAccessToken = () => {
			return getAuthStore().getState().accessToken;
		};
		emitter.on(ConsoleEventType.SignOut, () => {
			authStore.getState().reset();
		});
	},
});
