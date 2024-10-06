import { Logger } from '@nestjs/common';
import { App } from '@wener/nestjs/app';
import { getRedis } from '../redis/context';
import { getEvents, SystemEvents } from './events';
import { getRemoteEvents, RemoteEvents } from './getRemoteEvents';
import { handleSystemEventRelay } from './handleSystemEventRelay';
import { buildRemoteEvent, runRemoteEventHandler } from './runRemoteEventHandler';

export async function handleRemoteSystemEvents() {
  const log = new Logger(handleRemoteSystemEvents.name);
  let system = getEvents();
  let redis = getRedis();
  let remote = getRemoteEvents();
  await runRemoteEventHandler({
    events: remote,
    redis,
  });
  handleSystemEventRelay({ system, remote: remote });

  remote.on(RemoteEvents.ServerInfo, ({ instanceId, name, service }) => {
    log.log(`-> Server Info: ${name} ${instanceId} ${service}`);
  });

  // handle common events
  remote.on(SystemEvents.ServerReady, (evt) => {
    const { instanceId, dev, hostname } = evt;
    log.log(`-> Server Ready ${instanceId} ${hostname} ${dev}`);
    if (instanceId === App.instanceId) {
      return;
    }
    void remote.emit(RemoteEvents.ServerInfo, buildRemoteEvent(evt, { targetInstanceId: instanceId }));
  });

  remote.on(RemoteEvents.ServerPing, (evt) => {
    log.log(`-> Server Ping: ${evt.name} ${evt.instanceId} ${evt.service}`);
    void remote.emit(
      RemoteEvents.ServerPong,
      buildRemoteEvent(evt, {
        targetInstanceId: evt.instanceId,
      }),
    );
  });
  remote.on(RemoteEvents.ServerPong, (evt) => {
    log.log(`-> Server Pong: ${evt.name} ${evt.instanceId} ${evt.service}`);
  });
}
