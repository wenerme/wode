import type { EventArgs, EventSubscriber, FlushEventArgs, TransactionEventArgs } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { StandardBaseEntity } from '../../entity/base/StandardBaseEntity';

@Injectable()
export class EntityEventSubscriber<T extends StandardBaseEntity> implements EventSubscriber<T> {
  private readonly log = new Logger(this.constructor.name);

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

  afterFlush(args: FlushEventArgs): void | Promise<void> {
    this.stats.flush++;
  }

  afterCreate(args: EventArgs<T>): void | Promise<void> {
    this.stats.create++;
    this.log.log(`create ${args.entity.id}`);
  }

  afterUpdate(args: EventArgs<T>): void | Promise<void> {
    this.stats.update++;
    this.log.log(`update ${args.entity.id}`);
  }

  afterUpsert(args: EventArgs<T>): void | Promise<void> {
    this.stats.upsert++;
    this.log.log(`upsert ${args.entity.id}`);
  }

  afterDelete(args: EventArgs<T>): void | Promise<void> {
    this.stats.delete++;
    this.log.log(`delete ${args.entity.id}`);
  }

  afterTransactionCommit(args: TransactionEventArgs): void | Promise<void> {
    this.stats.commit++;
  }

  afterTransactionRollback(args: TransactionEventArgs): void | Promise<void> {
    this.stats.rollback++;
  }

  afterTransactionStart(args: TransactionEventArgs): void | Promise<void> {
    this.stats.tx++;
  }
}
