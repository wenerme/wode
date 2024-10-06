import type { EntityManager } from '@mikro-orm/postgresql';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import { getEntitySeedDefs } from '@/foundation/meta/defineEntitySeed';
import { requireTenantId } from '@/foundation/Tenant';

export async function runSystemResourceImportSeed({ em }: { em?: EntityManager }) {
  let tid = requireTenantId();
  em = getEntityManager({ em });
  await em.transactional(async (em) => {
    let seeds = getEntitySeedDefs();
    for (let seed of seeds) {
      const { Entity, data, onConflict } = seed;
      await em.upsertMany(
        Entity,
        data.map((v) => {
          return {
            ...v,
            tid: tid,
          };
        }),
        {
          onConflictFields: (onConflict.fields as any[]) ?? [],
          onConflictMergeFields: onConflict.merge as any[],
          onConflictExcludeFields: onConflict.exclude as any[],
          onConflictAction: onConflict.action,
        },
      );
    }
  });
}
