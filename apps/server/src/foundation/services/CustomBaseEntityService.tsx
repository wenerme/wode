import { LockMode, type EntityData } from '@mikro-orm/core';
import type { StandardBaseEntity } from '@wener/nestjs/entity';
import { EntityAuditAction, writeEntityAuditLog } from '@wener/nestjs/entity/audit';
import { EntityBaseService, type PatchEntityRequest } from '@wener/nestjs/entity/service';
import { setData } from '@/entity/base/setData';

export class CustomBaseEntityService<E extends StandardBaseEntity> extends EntityBaseService<E> {
  // async setEntityStatus(ent: ResolveEntityOptions<E>, opts: SetEntityStatusOptions & { state?: string }) {
  //   const { entity } = await this.requireEntity(ent);
  //   Errors.BadRequest.check(hasEntityFeature(entity, EntityFeature.HasStateStatus), '资源不支持状态');
  //   entity.status = opts.status;
  //   entity.state = opts.state || entity.state;
  //   await this.em.persistAndFlush(entity);
  //   return { entity };
  // }

  async patch(req: PatchEntityRequest) {
    return this.em.transactional(async (em) => {
      const { data } = req;
      const entity = await this.getEntity(req, {
        lockMode: LockMode.PESSIMISTIC_WRITE,
      });
      const before = entity.toPOJO();
      {
        const { attributes, properties, extensions, ...rest } = data as EntityData<StandardBaseEntity>;
        entity.assign(trimUndefined(rest));
        if (attributes) {
          entity.attributes = setData(entity.attributes, { data: attributes, partial: true });
        }
        if (properties) {
          entity.properties = setData(entity.properties, { data: properties, partial: true });
        }
        if (extensions) {
          entity.extensions = setData(entity.extensions, { data: extensions, partial: true });
        }
      }
      writeEntityAuditLog({
        entity,
        action: EntityAuditAction.Patch,
        em,
        before,
        after: entity.toPOJO(),
      });
      await em.persistAndFlush(entity);
      return entity;
    });
  }
}

export const RedactedText = '$[REDACTED]$';

function trimUndefined(o: any) {
  for (const k in o) {
    switch (o[k]) {
      case RedactedText:
      case undefined:
        delete o[k];
        break;
    }
  }
  return o;
}
