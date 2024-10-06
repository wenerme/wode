import type { EventArgs } from '@mikro-orm/core';
import _ from 'lodash';
import { EntityEvents } from './EntityEventRelaySubscriber';
import type { SystemEmitter } from './events';
import type { RemoteEmitter } from './getRemoteEvents';

export function handleSystemEventRelay({ system, remote }: { remote: RemoteEmitter; system: SystemEmitter }) {
  const handleEntityEvent = (eventName: string, evt: EventArgs<any>) => {
    const { entity } = evt;
    const e = _.pick(entity, ['id', 'uid', 'tid', 'eid', 'cid', 'rid']);

    void remote.emit(eventName as any, { entity: e });
    // unified event
    void remote.emit('entity:change', {
      type: eventName,
      entity: e,
    });
  };

  {
    const all = [
      EntityEvents.EntityCreate,
      EntityEvents.EntityDelete,
      EntityEvents.EntityUpdate,
      EntityEvents.EntityUpsert,
    ];
    for (let name of all) {
      system.on(name, (evt: any) => handleEntityEvent(name, evt));
    }
  }
}
