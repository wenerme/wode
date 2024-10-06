import { getGlobalStates, getUserState } from '@wener/console/console';
import { defineAbilityForUser, type ConsoleAbility } from './casl';

type UserAbility = {
  can: ConsoleAbility['can'];
  cannot: ConsoleAbility['cannot'];
};

export function getUserAbility(): UserAbility {
  return getGlobalStates('UserAbility', (): UserAbility => {
    const user = getUserState();
    let ab = defineAbilityForUser({ id: user.id, roles: user.roles.map((v) => v.code) });

    return {
      can: ab.can.bind(ab),
      cannot: ab.cannot.bind(ab),
    };
  });
}

export function can(...args: Parameters<ConsoleAbility['can']>) {
  return getUserAbility().can(...args);
}

export function cannot(...args: Parameters<ConsoleAbility['cannot']>) {
  return getUserAbility().cannot(...args);
}
