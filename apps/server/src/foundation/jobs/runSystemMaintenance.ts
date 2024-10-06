import type { EntityManager } from '@mikro-orm/postgresql';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import { runSystemResourceImportSeed } from '@/foundation/jobs/runSystemResourceImportSeed';
import { getEvents } from '@/server/events';
import { SystemEvents } from '@/server/events/events';

export async function runSystemMaintenance({ em }: { em?: EntityManager } = {}) {
  em = getEntityManager({ em });
  await runSystemResourceImportSeed({ em });
  // await runSystemJobMaintenance({ em });

  await getEvents().emit(SystemEvents.Maintenance, { em });
}
