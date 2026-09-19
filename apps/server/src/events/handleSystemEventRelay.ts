import { EntityEvents } from './EntityEmitter';
import { getSystemEmitter, type SystemEmitter } from './SystemEmitter';

export function handleSystemEventRelay({ system = getSystemEmitter() }: { system?: SystemEmitter } = {}) {
	let closer: (() => void)[] = [];
	const changeType = {
		[EntityEvents.EntityCreateAfter]: 'create',
		[EntityEvents.EntityDeleteAfter]: 'delete',
		[EntityEvents.EntityUpdateAfter]: 'update',
		[EntityEvents.EntityUpsertAfter]: 'upsert',
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
				// provide unified event
				return system.emit(EntityEvents.EntityChange, {
					...event.data,
					type: type,
				});
			}),
		);
	}
	return () => {
		closer.forEach((c) => c());
	};
}
