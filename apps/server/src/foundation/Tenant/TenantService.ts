import { InjectRepository } from '@mikro-orm/nestjs';
import { EnsureRequestContext, EntityManager, EntityRepository, MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { getFallbackTenantId } from '@wener/nestjs/app';
import { isULID, isUUID } from '@wener/utils';
import { TenantEntity } from '@/foundation/Tenant/entity/TenantEntity';
import { matchTenantFromHost } from './matchTenantFromHost';

@Injectable()
export class TenantService {
  private readonly log = new Logger(TenantService.name);

  constructor(
    @Inject(MikroORM) private readonly orm: MikroORM,
    @Inject(EntityManager) private readonly em: EntityManager,
    @InjectRepository(TenantEntity) private readonly repo: EntityRepository<TenantEntity>,
  ) {}

  @EnsureRequestContext()
  async findTenantByHost({ host }: { host?: string | undefined } = {}) {
    const { repo } = this;
    const match = matchTenantFromHost(host);
    if (!match?.tenant) {
      return undefined;
    }

    const qb = repo.qb();
    qb.cache(180 * 1000);

    if (match.name) {
      if (isULID(match.name)) {
        qb.orWhere({ tid: `org_${match.name}` });
      } else if (isUUID(match.name)) {
        qb.orWhere({ uid: match.name });
      } else {
        this.log.warn(`resolve ${host} to invalid tenant ${match.name}`);
        return undefined;
      }
    } else if (match.domain) {
      // fixme 支持多个域名
      qb.orWhere({ domainName: match.domain });
    } else {
      return undefined;
    }

    qb.cache(5 * 60 * 1000); // 5min cache
    const tenant = await qb.getSingleResult();
    this.log.log(`resolve ${host} to ${tenant?.id}`);
    return tenant ?? undefined;
  }

  async resolveTenant({ tid }: { tid?: string }) {
    const { repo, log } = this;
    let query;
    let tenant: TenantEntity | undefined | null;
    if (tid) {
      if (isULID(tid)) {
        tid = 'org_' + tid.toLowerCase();
      }

      if (tid.startsWith('org_')) {
        query = { tid: tid };
      } else if (isUUID(tid)) {
        query = { uid: tid };
      } else if (tid) {
        query = { fullName: tid };
      }
    }

    if (query) {
      tenant = await repo.findOne(query, {
        cache: 180 * 1000,
      });
    } else {
      const all = await repo.findAll({
        where: {
          tid: {
            $ne: getFallbackTenantId(),
          },
        },
        limit: 2,
      });
      if (all.length === 1) {
        tenant = all[0];
      }
    }

    if (!tenant) {
      log.warn(`resolve tenant ${tid} not found`);
    } else {
      log.log(`resolve tenant ${tid} to ${tenant.id}`);
    }

    return tenant;
  }
}
