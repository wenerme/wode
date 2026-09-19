import { pick } from 'es-toolkit';
import type { StandardBaseEntity } from '@wener/server/entity';
import { EntityEvents, getSystemEmitter, type SystemEmitter } from '#/events';
import { getRemoteEmitter, type RemoteEmitter, RemoteEvents } from './RemoteEmitter';

type RelayEntity = Omit<StandardBaseEntity, 'eid'> & {
	tid: string;
	eid?: string;
	cid?: string;
	rid?: string;
};

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
	for (let name of all) {
		closer.push(
			system.on(name, (event) => {
				let type = changeType[name];
				{
					const { entity } = event.data;
					const e = pick(entity as RelayEntity, ['id', 'uid', 'tid', 'eid', 'cid', 'rid']);

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
