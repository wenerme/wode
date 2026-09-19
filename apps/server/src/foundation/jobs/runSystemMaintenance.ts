import type { EntityManager } from '@mikro-orm/postgresql';
import { getEntityManager } from '@wener/server/mikro-orm';
import { runSystemResourceImportSeed } from '@/foundation/jobs/runSystemResourceImportSeed';
import { getSystemEmitter, SystemEvents } from '@/events';

export async function runSystemMaintenance({ em }: { em?: EntityManager } = {}) {
	em = getEntityManager({ em });
	await runSystemResourceImportSeed({ em });
	// await runSystemJobMaintenance({ em });

	await getSystemEmitter().emit(SystemEvents.Maintenance, { em });
}
