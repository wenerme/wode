import type { EventArgs, EventSubscriber, FlushEventArgs, TransactionEventArgs } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StandardBaseEntity } from '../../entity/StandardBaseEntity';

@Injectable()
export class EntityEventSubscriber implements EventSubscriber<StandardBaseEntity<any>> {
  private readonly log = new Logger(EntityEventSubscriber.name);

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

  constructor(private readonly emitter: EventEmitter2) {}

  afterFlush(args: FlushEventArgs): void | Promise<void> {
    this.stats.flush++;
  }

  afterCreate(args: EventArgs<StandardBaseEntity<any>>): void | Promise<void> {
    this.stats.create++;
    this.log.log(`create ${args.entity.id}`);
  }

  afterUpdate(args: EventArgs<StandardBaseEntity<any>>): void | Promise<void> {
    this.stats.update++;
    this.log.log(`update ${args.entity.id}`);
  }

  afterUpsert(args: EventArgs<StandardBaseEntity<any>>): void | Promise<void> {
    this.stats.upsert++;
    this.log.log(`upsert ${args.entity.id}`);
  }

  afterDelete(args: EventArgs<StandardBaseEntity<any>>): void | Promise<void> {
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

  // 作为 唯一条件，需要前处理
  // beforeUpsert(args: EventArgs<StandardBaseEntity<any>>): void | Promise<void> {
  //   // args.meta check has tid
  //   (args.entity as any).tid ||= getTenantId()
  // }
}
