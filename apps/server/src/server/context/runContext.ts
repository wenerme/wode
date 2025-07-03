import { RequestContext } from '@mikro-orm/core';
import { Currents } from '@wener/nestjs';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import type { MaybePromise } from '@wener/utils';

export function runContext<T>(f: () => MaybePromise<T>) {
	return RequestContext.create(getEntityManager(), async () => Currents.run(f));
}
