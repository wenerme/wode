import type { EntityData, RequiredEntityData } from '@mikro-orm/core';
import { EntityManager, type EntityRepository } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { StandardBaseEntity } from '@wener/nestjs/entity';
import { AuthEntityRoleEntity } from '@/foundation/Auth/entity/AuthEntityRoleEntity';
import { AuthPermissionEntity } from '@/foundation/Auth/entity/AuthPermissionEntity';
import { AuthRoleEntity } from '@/foundation/Auth/entity/AuthRoleEntity';
import type { UserEntity } from '@/foundation/User/entity/UserEntity';

@Injectable()
export class AccessControlService {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async importRole(req: ImportOptions<RequiredEntityData<AuthRoleEntity>>) {
    return doImport({
      repo: this.em.getRepository(AuthRoleEntity),
      ...req,
    });
  }

  async importPermission(req: ImportOptions<RequiredEntityData<AuthPermissionEntity>>) {
    return doImport({
      repo: this.em.getRepository(AuthPermissionEntity),
      ...req,
    });
  }

  async resolveUserAccess(user: UserEntity) {
    let repo = this.em.getRepository(AuthEntityRoleEntity);
    const all = await repo.findAll({
      where: {
        entityId: user.id,
      },
    });

    return {
      roles: all.map((v) => v.role),
    };

    // await Promise.all([
    //   user.roles.load({
    //     populate: ['permissions'],
    //   }),
    //   user.permissions.load({}),
    // ]);
    //
    // let roles = user.roles.getItems();
    // let permissions = user.roles
    //   .getItems()
    //   .flatMap((v) => v.permissions.getItems())
    //   .concat(user.permissions.getItems());
    // return {
    //   roles,
    //   permissions,
    // };
  }
}

interface ImportOptions<T> {
  base?: T;
  values?: T[];
  onConflict?: {
    fields?: string[];
    action?: string;
    merge?: string[];
    exclude?: string[];
  };
}

async function doImport<E extends StandardBaseEntity>({
  repo,
  base,
  values = [],
  onConflict = {},
}: ImportOptions<EntityData<E>> & {
  repo: EntityRepository<E>;
}) {
  if (base) {
    values = values.map((v) => Object.assign({}, base, v));
  }

  const data = await repo.upsertMany(values, {
    onConflictFields: onConflict.fields as any[],
    onConflictMergeFields: onConflict.merge as any[],
    onConflictExcludeFields: onConflict.exclude as any[],
    onConflictAction: onConflict.action as 'ignore',
  });

  return {
    data,
  };
}
