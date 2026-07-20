import type { EventArgs, EventSubscriber, FlushEventArgs, TransactionEventArgs } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import type { StandardBaseEntity } from '@wener/server/entity';
import { type EntityEmitter, EntityEvents, getEntityEmitter } from '#/events/EntityEmitter';

@Injectable()
export class EntityEventRelaySubscriber implements EventSubscriber<StandardBaseEntity> {
	private readonly log = new Logger(EntityEventRelaySubscriber.name);

	public emitter: EntityEmitter = getEntityEmitter();

	readonly stats = {
		flush: 0,
		create: 0,
		delete: 0,
		update: 0,
		upsert: 0,
		tx: 0,
		commit: 0,
		rollback: 0,
	};

	private static _instance: EntityEventRelaySubscriber;

	static getInstance() {
		if (!EntityEventRelaySubscriber._instance) {
			EntityEventRelaySubscriber._instance = new EntityEventRelaySubscriber();
		}
		return EntityEventRelaySubscriber._instance;
	}

	onInit(args: EventArgs<StandardBaseEntity>) {
		// new instance of entity is created
		// 1. em.create
		// 2. load from db
		return this.emitter.emit(EntityEvents.EntityInit, args);
	}

	onLoad(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
		// new entity is loaded into context
		// vs onInit - onLoad fired only for fully loaded entities
		// 1. em.find, em.populate
		return this.emitter.emit(EntityEvents.EntityLoad, args);
	}

	beforeCreate(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
		return this.emitter.emit(EntityEvents.EntityCreateBefore, args);
	}

	afterCreate(args: EventArgs<StandardBaseEntity>) {
		this.stats.create++;
		return this.emitter.emit(EntityEvents.EntityCreateAfter, args);
	}

	beforeUpdate(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
		return this.emitter.emit(EntityEvents.EntityUpdateBefore, args);
	}

	afterUpdate(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
		this.stats.update++;
		return this.emitter.emit(EntityEvents.EntityUpdateAfter, args);
	}

	beforeUpsert(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
		return this.emitter.emit(EntityEvents.EntityUpsertBefore, args);
	}

	afterUpsert(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
		this.stats.upsert++;
		return this.emitter.emit(EntityEvents.EntityUpsertAfter, args);
	}

	beforeDelete(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
		return this.emitter.emit(EntityEvents.EntityDeleteBefore, args);
	}

	afterDelete(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
		this.stats.delete++;
		return this.emitter.emit(EntityEvents.EntityDeleteAfter, args);
	}

	beforeFlush(args: FlushEventArgs): void | Promise<void> {
		return this.emitter.emit(EntityEvents.FlushBefore, args);
	}

	onFlush(args: FlushEventArgs): void | Promise<void> {
		return this.emitter.emit(EntityEvents.Flush, args);
	}

	afterFlush(args: FlushEventArgs): void | Promise<void> {
		this.stats.flush++;
		return this.emitter.emit(EntityEvents.FlushAfter, args);
	}

	beforeTransactionStart(args: TransactionEventArgs): void | Promise<void> {
		return this.emitter.emit(EntityEvents.TransactionStartBefore, args);
	}

	afterTransactionStart(args: TransactionEventArgs): void | Promise<void> {
		this.stats.tx++;
		return this.emitter.emit(EntityEvents.TransactionStartAfter, args);
	}

	beforeTransactionCommit(args: TransactionEventArgs): void | Promise<void> {
		return this.emitter.emit(EntityEvents.TransactionCommitBefore, args);
	}

	afterTransactionCommit(args: TransactionEventArgs): void | Promise<void> {
		this.stats.commit++;
		return this.emitter.emit(EntityEvents.TransactionCommitAfter, args);
	}

	beforeTransactionRollback(args: TransactionEventArgs): void | Promise<void> {
		return this.emitter.emit(EntityEvents.TransactionRollbackBefore, args);
	}

	afterTransactionRollback(args: TransactionEventArgs): void | Promise<void> {
		this.stats.rollback++;
		return this.emitter.emit(EntityEvents.TransactionRollbackAfter, args);
	}
}
