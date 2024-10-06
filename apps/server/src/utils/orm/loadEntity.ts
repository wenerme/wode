import { BaseEntity, Collection } from '@mikro-orm/core';
import { Reference } from '@mikro-orm/postgresql';

export function loadEntity<E extends object>(e?: null | E | Collection<E> | Reference<E>) {
  if (!e) {
    return undefined;
  }
  if (e instanceof Collection) {
    return e.load({ dataloader: true });
  }
  if (e instanceof Reference) {
    if (e.isInitialized()) {
      return e.unwrap();
    }
    return e.load({ dataloader: true });
  }
  if (e instanceof BaseEntity) {
    if (e.isInitialized()) {
      return e;
    }
    return e.toReference().load({ dataloader: true });
  }
  // if (hasMixin(e, BaseEntity)) {
  //   if (e.isInitialized()) {
  //     return e;
  //   }
  //   return e.toReference().load({
  //     dataloader: true,
  //   });
  // }
  return e;
}
