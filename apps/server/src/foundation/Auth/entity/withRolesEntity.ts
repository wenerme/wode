import { Entity } from '@mikro-orm/core';
import type { IdentifiableEntity } from '@wener/nestjs/entity';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import type { Constructor } from '@wener/utils';
import { AuthEntityRoleEntity } from '@/foundation/Auth/entity/AuthEntityRoleEntity';

export function withRolesEntity<TBase extends Constructor>(Base: TBase) {
  @Entity({ abstract: true })
  class HasRolesMixinEntity extends Base {
    async loadRoles() {
      const all = await getEntityManager()
        .getRepository(AuthEntityRoleEntity)
        .findAll({
          where: {
            entityId: (this as any as IdentifiableEntity).id,
          },
        });
      return all.map((v) => v.related);
    }
  }

  return HasRolesMixinEntity;
}
