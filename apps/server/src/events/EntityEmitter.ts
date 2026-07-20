import type { BaseEntity, EntityManager, EventArgs, FlushEventArgs, TransactionEventArgs } from '@mikro-orm/core';
import type { StandardBaseEntity } from '@wener/server/entity';
import { getEntityManager } from '@wener/server/mikro-orm';
import type Emittery from 'emittery';
// import { getRemoteEmitter, RemoteEvents } from '@/server/events/RemoteEmitter';
import { getSystemEmitter } from './SystemEmitter';

export const EntityEvents = {
	EntityInit: 'entity:init',
	EntityLoad: 'entity:load',

	EntityCreateBefore: 'entity:create:before',
	EntityCreateAfter: 'entity:create:after',
	EntityUpdateBefore: 'entity:update:before',
	EntityUpdateAfter: 'entity:update:after',
	EntityUpsertBefore: 'entity:upsert:before',
	EntityUpsertAfter: 'entity:upsert:after',
	EntityDeleteBefore: 'entity:delete:before',
	EntityDeleteAfter: 'entity:delete:after',
	EntityChange: 'entity:change',

	FlushBefore: 'db:flush:before',
	Flush: 'db:flush',
	FlushAfter: 'db:flush:after',

	TransactionStartBefore: 'transaction:start:before',
	TransactionStartAfter: 'transaction:start:after',
	TransactionCommitBefore: 'transaction:commit:before',
	TransactionCommitAfter: 'transaction:commit:after',
	TransactionRollbackBefore: 'transaction:rollback:before',
	TransactionRollbackAfter: 'transaction:rollback:after',
} as const;
export type EntityChangeType = 'create' | 'update' | 'delete' | 'upsert';
export type EntityEventData = {
	[EntityEvents.EntityInit]: EventArgs<StandardBaseEntity>;
	[EntityEvents.EntityLoad]: EventArgs<StandardBaseEntity>;
	[EntityEvents.EntityCreateBefore]: EventArgs<StandardBaseEntity>;
	[EntityEvents.EntityCreateAfter]: EventArgs<StandardBaseEntity>;
	[EntityEvents.EntityUpdateBefore]: EventArgs<StandardBaseEntity>;
	[EntityEvents.EntityUpdateAfter]: EventArgs<StandardBaseEntity>;
	[EntityEvents.EntityUpsertBefore]: EventArgs<StandardBaseEntity>;
	[EntityEvents.EntityUpsertAfter]: EventArgs<StandardBaseEntity>;
	[EntityEvents.EntityDeleteBefore]: EventArgs<StandardBaseEntity>;
	[EntityEvents.EntityDeleteAfter]: EventArgs<StandardBaseEntity>;
	[EntityEvents.EntityChange]: EventArgs<StandardBaseEntity> & {
		type: EntityChangeType;
	};

	[EntityEvents.FlushBefore]: FlushEventArgs;
	[EntityEvents.Flush]: FlushEventArgs;
	[EntityEvents.FlushAfter]: FlushEventArgs;

	[EntityEvents.TransactionStartBefore]: TransactionEventArgs;
	[EntityEvents.TransactionStartAfter]: TransactionEventArgs;
	[EntityEvents.TransactionCommitBefore]: TransactionEventArgs;
	[EntityEvents.TransactionCommitAfter]: TransactionEventArgs;
	[EntityEvents.TransactionRollbackBefore]: TransactionEventArgs;
	[EntityEvents.TransactionRollbackAfter]: TransactionEventArgs;
};
export type EntityEmitter = Emittery<EntityEventData>;

export function getEntityEmitter(): EntityEmitter {
	return getSystemEmitter() as any as EntityEmitter;
}

export async function* watchEntity<E extends BaseEntity & { id: any }>({
	entity,
	em = getEntityManager<EntityManager>(),
	signal,
}: {
	entity: E;
	em?: EntityManager;
	signal?: AbortSignal;
}): AsyncIterableIterator<{
	entity: E;
	type: EntityChangeType;
}> {
	const id = entity.id;
	const itor = getSystemEmitter().events(EntityEvents.EntityChange);
	const handleAbort = () => itor.return?.();
	signal?.addEventListener('abort', handleAbort);
	try {
		for await (let event of itor) {
			if (event.entity.id !== id) {
				continue;
			}
			await em.transactional((em) => em.refresh(entity));
			yield {
				entity,
				type: event.type,
			};
		}
	} finally {
		signal?.removeEventListener('abort', handleAbort);
	}
}
