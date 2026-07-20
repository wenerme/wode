import { getGlobalStates } from '@wener/utils';
import Emittery from 'emittery';
import { SystemEvents } from '#/events/SystemEmitter';

export const RemoteEvents = {
	ServerPing: 'server:ping',
	ServerPong: 'server:pong',
	ServerInfo: 'server:info',

	EntityChange: 'entity:change',
	EntityCreate: 'entity:create',
	EntityDelete: 'entity:delete',
	EntityUpdate: 'entity:update',
	EntityUpsert: 'entity:upsert',
} as const;

type InstanceInfo = {
	instanceId: string;
	name: string;
	component: string;
	service: string;
	hostname: string;
};

type RemoteEventData = {
	[SystemEvents.ServerReady]: RemoteEvent<InstanceInfo & { dev?: boolean }>;

	[RemoteEvents.ServerInfo]: RemoteEvent<InstanceInfo>;
	[RemoteEvents.ServerPing]: RemoteEvent<InstanceInfo>;
	[RemoteEvents.ServerPong]: RemoteEvent<InstanceInfo>;

	[RemoteEvents.EntityCreate]: RemoteEvent<{ entity: RemoteEntity }>;
	[RemoteEvents.EntityUpdate]: RemoteEvent<{ entity: RemoteEntity }>;
	[RemoteEvents.EntityDelete]: RemoteEvent<{ entity: RemoteEntity }>;
	[RemoteEvents.EntityUpsert]: RemoteEvent<{ entity: RemoteEntity }>;
	[RemoteEvents.EntityChange]: RemoteEvent<{ entity: RemoteEntity; type: string }>;
};
type RemoteEvent<T> = T;
export type RemoteEmitter = Emittery<RemoteEventData>;

export function getRemoteEmitter(): Emittery<RemoteEventData> {
	return getGlobalStates('RemoteEmitter', () => {
		return new Emittery<RemoteEventData>();
	});
}

type RemoteEntity = {
	id: string;
	uid: string;
	tid: string;
	eid?: string;
	cid?: string;
	rid?: string;
};
