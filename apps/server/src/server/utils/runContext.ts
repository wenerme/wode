import { RequestContext } from '@mikro-orm/core';
import { Currents } from '@wener/server';
import { Contexts } from '@wener/server/app';
import { getEntityManager } from '@wener/server/mikro-orm';
import type { MaybePromise } from '@wener/utils';

export function runContext<T>(f: () => MaybePromise<T>) {
	return RequestContext.create(getEntityManager(), async () => Currents.run(f));
}

export function runTenantContext<T>(tid: string, f: () => MaybePromise<T>) {
	return runContext(() => {
		Contexts.tenantId.set(tid);
		return f();
	});
}
