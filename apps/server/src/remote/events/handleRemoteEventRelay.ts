import type { EventArgs } from '@mikro-orm/core';
import { pick } from 'es-toolkit';
import { EntityEvents, getSystemEmitter, type SystemEmitter } from '#/events';
import { getRemoteEmitter, type RemoteEmitter, RemoteEvents } from './RemoteEmitter';

export function handleRemoteEventRelay({
	system = getSystemEmitter(),
	remote = getRemoteEmitter(),
}: {
	remote?: RemoteEmitter;
	system?: SystemEmitter;
} = {}) {
	let closer: (() => void)[] = [];
	const changeType = {
		[EntityEvents.EntityCreateAfter]: 'create',
		[EntityEvents.EntityDeleteAfter]: 'delete',
		[EntityEvents.EntityUpdateAfter]: 'update',
		[EntityEvents.EntityUpsertAfter]: 'upsert',
	} as const;
	const remoteType = {
		[EntityEvents.EntityCreateAfter]: RemoteEvents.EntityCreate,
		[EntityEvents.EntityDeleteAfter]: RemoteEvents.EntityDelete,
		[EntityEvents.EntityUpdateAfter]: RemoteEvents.EntityUpdate,
		[EntityEvents.EntityUpsertAfter]: RemoteEvents.EntityUpsert,
	} as const;
	const all = [
		EntityEvents.EntityCreateAfter,
		EntityEvents.EntityDeleteAfter,
		EntityEvents.EntityUpdateAfter,
		EntityEvents.EntityUpsertAfter,
	] as const;
	type EntityEvent = (typeof all)[number];
	for (let name of all) {
		closer.push(
			system.on(name, (evt: EventArgs<any>) => {
				let type = changeType[name];
				{
					const { entity } = evt;
					const e = pick(entity, ['id', 'uid', 'tid', 'eid', 'cid', 'rid']);

					void remote.emit(remoteType[name], { entity: e });
					void remote.emit(RemoteEvents.EntityChange, {
						type,
						entity: e,
					});
				}
			}),
		);
	}
	return () => {
		closer.forEach((c) => c());
	};
}
