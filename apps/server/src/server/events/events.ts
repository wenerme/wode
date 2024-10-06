import type { EntityManager } from '@mikro-orm/postgresql';
import { getGlobalStates } from '@wener/utils';
import Emittery from 'emittery';
import type { EntityEventData } from './EntityEventRelaySubscriber';

export function getEvents(): SystemEmitter {
  return getGlobalStates('SystemEmitter', () => {
    return new Emittery<SystemEventData>();
  });
}

export const SystemEvents = {
  ServerReady: 'server:ready',
  Maintenance: 'system:maintenance',
} as const;

type SystemEventData = EntityEventData & {
  [SystemEvents.ServerReady]: {};
  [SystemEvents.Maintenance]: { em: EntityManager };
};

export type SystemEmitter = Emittery<SystemEventData>;
