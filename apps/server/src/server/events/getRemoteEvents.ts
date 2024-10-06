import { getGlobalStates } from '@wener/utils';
import Emittery from 'emittery';
import { EntityEvents } from '@/server/events/EntityEventRelaySubscriber';
import { SystemEvents } from '@/server/events/events';

export const RemoteEvents = {
  ServerPing: 'server:ping',
  ServerPong: 'server:pong',
  ServerInfo: 'server:info',
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

  [EntityEvents.EntityCreate]: RemoteEvent<{ entity: RemoteEntity }>;
  [EntityEvents.EntityUpdate]: RemoteEvent<{ entity: RemoteEntity }>;
  [EntityEvents.EntityDelete]: RemoteEvent<{ entity: RemoteEntity }>;
  [EntityEvents.EntityUpsert]: RemoteEvent<{ entity: RemoteEntity }>;
  [EntityEvents.EntityChange]: RemoteEvent<{ entity: RemoteEntity; type?: string }>;
};
type RemoteEvent<T> = T;
export type RemoteEmitter = Emittery<RemoteEventData>;

export function getRemoteEvents(): Emittery<RemoteEventData> {
  return getGlobalStates('DistributedEmitter', () => {
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
