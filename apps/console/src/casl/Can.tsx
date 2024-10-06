import type React from 'react';
import { createContext, useContext } from 'react';
import { Can as _Can, type CanProps as _CanProps } from '@casl/react';
import type { ConsoleAbility } from './casl';
import { getUserAbility } from './getUserAbility';

const AbilityContext = createContext<ConsoleAbility | undefined>(undefined);

export function useAbility() {
  return useContext(AbilityContext) ?? getUserAbility();
}

export type CanProps = Omit<_CanProps<ConsoleAbility>, 'ability'>;
export const Can: React.FC<CanProps> = (props) => {
  const ab = useAbility();
  return <_Can<ConsoleAbility, true> ability={ab} {...(props as any)} />;
};

export namespace Ability {
  export const Provider = AbilityContext.Provider;
}
