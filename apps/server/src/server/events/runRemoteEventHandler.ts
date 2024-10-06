import { Logger } from '@nestjs/common';
import { App, getCurrentFallbackTenantId } from '@wener/nestjs/app';
import type Redis from 'ioredis';
import { isDev } from '@/const';
import type { RemoteEmitter } from './getRemoteEvents';

const MetaKey = '$DistributedEventMeta$';
type EventMeta = {
  seq: number;
  type: string;
  instanceId: string;
  targetInstanceId?: string;
  tid: string;
  timestamp: number;
  metadata: any;
};

function getMeta(evt: any): EventMeta | undefined {
  return evt[MetaKey];
}

function setMeta(evt: any, meta: Partial<EventMeta>) {
  const before = evt[MetaKey];
  evt[MetaKey] = {
    ...before,
    ...meta,
  };
  return evt;
}

function setSendMeta(evt: any, meta: Partial<EventMeta>) {
  return setMeta(evt, {
    ...meta,
    instanceId: App.instanceId,
    tid: getCurrentFallbackTenantId(),
    timestamp: Date.now(),
  });
}

export function buildRemoteEvent<T>(
  evt: T,
  opt: {
    targetInstanceId?: string;
  } = {},
): T {
  // let meta = getMeta(evt);
  // let { instanceId } = meta ?? {};
  // if (!meta || !instanceId) {
  //   throw new Error('Invalid event');
  // }

  return setMeta(evt, opt);
}

export async function runRemoteEventHandler({ events, redis }: { events: RemoteEmitter; redis: Redis }) {
  const log = new Logger(runRemoteEventHandler.name);
  const instanceId = App.instanceId;
  /*
events:event:${EventName}
events:instance:${InstanceId}:event:${EventName}
   */
  const prefix = 'events:';
  const eventPrefix = `${prefix}event:`;
  const instancePrefix = `${prefix}instance:`;
  let seq = 1;

  // local to remote
  events.onAny((eventName, evt) => {
    {
      let meta = getMeta(evt);

      // sent by self
      if (meta?.instanceId === instanceId) {
        return;
      }

      // local event
      if (meta && meta.timestamp) {
        return;
      }
    }

    // emit to remote
    evt = setSendMeta(structuredClone(evt), {
      seq: seq++,
      type: eventName,
    });
    let meta = getMeta(evt)!;

    if (isDev()) {
      log.debug(`send event ${meta.type} to ${meta.targetInstanceId ?? 'all'}`);
    }

    if (meta?.targetInstanceId) {
      redis.publish(`${instancePrefix}${meta.targetInstanceId}:event:${eventName}`, JSON.stringify(evt));
    } else {
      redis.publish(`${eventPrefix}${eventName}`, JSON.stringify(evt));
    }
  });

  // remote to local
  {
    let sub = redis.duplicate();
    sub.on('message', (channel, message) => {
      if (!channel.startsWith(prefix)) {
        return;
      }
      const evt = JSON.parse(message);
      let meta = getMeta(evt);
      // skip self & invalid
      if (
        !meta ||
        !meta.type ||
        !meta.instanceId ||
        meta.instanceId === instanceId ||
        (meta.targetInstanceId && meta.targetInstanceId !== instanceId)
      ) {
        return;
      }
      if (isDev()) {
        log.debug(`remote event ${meta.type} from ${meta.instanceId}`);
      }
      events.emit(meta.type as any, evt);
    });

    await sub.subscribe(
      // listen to all events
      `${eventPrefix}*`,
      `${instancePrefix}${instanceId}:event:*`,
      (err, result) => {
        if (err) {
          throw err;
        }
        log.log(`subscribed to ${result} channels`);
      },
    );
  }
}
