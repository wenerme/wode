import { RequestContext } from '@mikro-orm/core';
import { Currents } from '@wener/nestjs';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import type { MaybePromise } from '@wener/utils';
import { bootstrap } from './bootstrap';

export async function runContext<T>(f: () => MaybePromise<T>): Promise<T> {
  await bootstrap();
  return await RequestContext.createAsync(getEntityManager(), () => Currents.run(f) as any);
  // return Currents.run(f);
}
