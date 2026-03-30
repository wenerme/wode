import { Contexts } from '@wener/server/app';
import type { MaybePromise } from '@wener/utils';
import { runContext } from '@/server/context/runContext';

export function runTenantContext<T>(tid: string, f: () => MaybePromise<T>) {
	return runContext(() => {
		Contexts.tenantId.set(tid);
		return f();
	});
}
