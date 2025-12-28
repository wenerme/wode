import type { EntityManager } from '@mikro-orm/postgresql';
import { getGlobalStates } from '@wener/utils';
import Emittery from 'emittery';
import type { EntityEventData } from './EntityEmitter';

export function getSystemEmitter<E extends Emittery<any> = SystemEmitter>(): E {
	return getGlobalStates('SystemEmitter', () => {
		return new Emittery<SystemEventData>();
	}) as E;
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
