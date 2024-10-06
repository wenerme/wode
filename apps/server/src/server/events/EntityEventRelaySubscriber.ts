import type { EventArgs, EventSubscriber, FlushEventArgs, TransactionEventArgs } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import type { StandardBaseEntity } from '@wener/nestjs/entity';
import { getEvents } from './events';

@Injectable()
export class EntityEventRelaySubscriber implements EventSubscriber<StandardBaseEntity> {
  private readonly log = new Logger(EntityEventRelaySubscriber.name);

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

  constructor() {}

  getEvents = getEvents;

  private static _instance: EntityEventRelaySubscriber;

  static getInstance() {
    if (!this._instance) {
      this._instance = new EntityEventRelaySubscriber();
    }
    return this._instance;
  }

  onInit(args: EventArgs<StandardBaseEntity>) {
    // new instance of entity is created
    // 1. em.create
    // 2. load from db
    this.getEvents().emit(EntityEvents.EntityInit, args);
  }

  onLoad(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
    // new entity is loaded into context
    // vs onInit - onLoad fired only for fully loaded entities
    // 1. em.find, em.populate
    return this.getEvents().emit(EntityEvents.EntityLoad, args);
  }

  beforeCreate(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
    return this.getEvents().emit(EntityEvents.EntityCreateBefore, args);
  }

  afterCreate(args: EventArgs<StandardBaseEntity>) {
    this.stats.create++;
    this.log.log(`create ${args.entity.id}`);
    return this.getEvents().emit(EntityEvents.EntityCreate, args);
  }

  beforeUpdate(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
    return this.getEvents().emit(EntityEvents.EntityUpdateBefore, args);
  }

  afterUpdate(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
    this.stats.update++;
    this.log.log(`update ${args.entity.id}`);
    return this.getEvents().emit(EntityEvents.EntityUpdate, args);
  }

  beforeUpsert(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
    return this.getEvents().emit(EntityEvents.EntityUpsertBefore, args);
  }

  afterUpsert(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
    this.stats.upsert++;
    this.log.log(`upsert ${args.entity.id}`);
    return this.getEvents().emit(EntityEvents.EntityUpsert, args);
  }

  beforeDelete(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
    return this.getEvents().emit(EntityEvents.EntityDeleteBefore, args);
  }

  afterDelete(args: EventArgs<StandardBaseEntity>): void | Promise<void> {
    this.stats.delete++;
    this.log.log(`delete ${args.entity.id}`);
    return this.getEvents().emit(EntityEvents.EntityDelete, args);
  }

  beforeFlush(args: FlushEventArgs): void | Promise<void> {
    return this.getEvents().emit(EntityEvents.FlushBefore, args);
  }

  onFlush(args: FlushEventArgs): void | Promise<void> {
    return this.getEvents().emit(EntityEvents.Flush, args);
  }

  afterFlush(args: FlushEventArgs): void | Promise<void> {
    this.stats.flush++;
    return this.getEvents().emit(EntityEvents.FlushAfter, args);
  }

  beforeTransactionStart(args: TransactionEventArgs): void | Promise<void> {
    return this.getEvents().emit(EntityEvents.TransactionStartBefore, args);
  }

  afterTransactionStart(args: TransactionEventArgs): void | Promise<void> {
    this.stats.tx++;
    return this.getEvents().emit(EntityEvents.TransactionStart, args);
  }

  beforeTransactionCommit(args: TransactionEventArgs): void | Promise<void> {
    return this.getEvents().emit(EntityEvents.TransactionCommitBefore, args);
  }

  afterTransactionCommit(args: TransactionEventArgs): void | Promise<void> {
    this.stats.commit++;

    return this.getEvents().emit(EntityEvents.TransactionCommit, args);
  }

  beforeTransactionRollback(args: TransactionEventArgs): void | Promise<void> {
    return this.getEvents().emit(EntityEvents.TransactionRollbackBefore, args);
  }

  afterTransactionRollback(args: TransactionEventArgs): void | Promise<void> {
    this.stats.rollback++;
    return this.getEvents().emit(EntityEvents.TransactionRollback, args);
  }
}

export const EntityEvents = {
  EntityInit: 'entity:init',
  EntityLoad: 'entity:load',
  EntityCreateBefore: 'entity:create:before',
  EntityCreate: 'entity:create',
  EntityUpdateBefore: 'entity:update:before',
  EntityUpdate: 'entity:update',
  EntityUpsertBefore: 'entity:upsert:before',
  EntityUpsert: 'entity:upsert',
  EntityChange: 'entity:change',
  EntityDeleteBefore: 'entity:delete:before',
  EntityDelete: 'entity:delete',
  FlushBefore: 'db:flush:before',
  Flush: 'db:flush',
  FlushAfter: 'db:flush:after',
  TransactionStartBefore: 'transaction:start:before',
  TransactionStart: 'transaction:start',
  TransactionCommitBefore: 'transaction:commit:before',
  TransactionCommit: 'transaction:commit',
  TransactionRollbackBefore: 'transaction:rollback:before',
  TransactionRollback: 'transaction:rollback',
} as const;
export type EntityEventData = {
  [EntityEvents.EntityInit]: EventArgs<StandardBaseEntity>;
  [EntityEvents.EntityLoad]: EventArgs<StandardBaseEntity>;
  [EntityEvents.EntityCreateBefore]: EventArgs<StandardBaseEntity>;
  [EntityEvents.EntityCreate]: EventArgs<StandardBaseEntity>;
  [EntityEvents.EntityUpdateBefore]: EventArgs<StandardBaseEntity>;
  [EntityEvents.EntityUpdate]: EventArgs<StandardBaseEntity>;
  [EntityEvents.EntityUpsertBefore]: EventArgs<StandardBaseEntity>;
  [EntityEvents.EntityUpsert]: EventArgs<StandardBaseEntity>;
  [EntityEvents.EntityDeleteBefore]: EventArgs<StandardBaseEntity>;
  [EntityEvents.EntityDelete]: EventArgs<StandardBaseEntity>;

  [EntityEvents.FlushBefore]: FlushEventArgs;
  [EntityEvents.Flush]: FlushEventArgs;
  [EntityEvents.FlushAfter]: FlushEventArgs;

  [EntityEvents.TransactionStartBefore]: TransactionEventArgs;
  [EntityEvents.TransactionStart]: TransactionEventArgs;
  [EntityEvents.TransactionCommitBefore]: TransactionEventArgs;
  [EntityEvents.TransactionCommit]: TransactionEventArgs;
  [EntityEvents.TransactionRollbackBefore]: TransactionEventArgs;
  [EntityEvents.TransactionRollback]: TransactionEventArgs;
};
