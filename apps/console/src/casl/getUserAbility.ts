import { getUserStore } from '@wener/console/console';
import { getGlobalStates } from '@wener/utils';
import { type ConsoleAbility, defineAbilityForUser } from './casl';

export function getUserAbility(): ConsoleAbility {
	return getGlobalStates('UserAbility', (): ConsoleAbility => {
		const user = getUserStore().getState();
		return defineAbilityForUser({ id: user.id, roles: (user.roles || []).map((v) => v.code) });
	});
}

export function can(...args: Parameters<ConsoleAbility['can']>) {
	return getUserAbility().can(...args);
}

export function cannot(...args: Parameters<ConsoleAbility['cannot']>) {
	return getUserAbility().cannot(...args);
}
