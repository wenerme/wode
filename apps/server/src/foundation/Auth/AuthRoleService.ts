import { MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityDef, StandardBaseEntity } from '@wener/nestjs/entity';
import { Errors } from '@wener/utils';
import { AuthEntityRoleEntity, AuthRoleEntity } from '@/foundation/Auth/entity';
import { CustomBaseEntityService } from '@/foundation/services/CustomBaseEntityService';

@Injectable()
export class AuthRoleService extends CustomBaseEntityService<AuthRoleEntity> {
  constructor(@Inject(MikroORM) orm: MikroORM) {
    super(orm, AuthRoleEntity);
  }

  // async create(req: CreateEntityRequest & { data: RequiredEntityData<AuthRoleEntity> }): Promise<AuthRoleEntity> {
  //   if (req.data.children) {
  //     req.data.children = await Promise.all(req.data.children.map(resolveEntity));
  //   }
  //   return super.create(req);
  // }
  //
  // async update(req: CreateEntityRequest & { data: RequiredEntityData<AuthRoleEntity> }): Promise<AuthRoleEntity> {
  //   if (req.data.children) {
  //     req.data.children = await Promise.all(req.data.children.map(resolveEntity));
  //   }
  //   return super.update(req);
  // }

  async revoke({ entityId, roleId }: { entityId: string; roleId: string }) {
    const role = await this.get({ id: roleId });
    let def = getEntityDef(entityId);
    if (!def) {
      throw new Error(`Entity not found ${entityId}`);
    }
    const entity = await this.em.getRepository<StandardBaseEntity>(def.Entity).findOne(entityId);
    Errors.NotFound.check(entity, `Entity not found ${entityId}`);
    const rel = await this.em.getRepository(AuthEntityRoleEntity).findOne({
      related: role,
      entityId: entity.id,
      entityType: def.typeName,
    });
    Errors.NotFound.check(rel, `Relation not found ${entityId}`);

    this.em.remove(rel);

    await this.em.flush();

    return {
      entity,
      role,
    };
  }

  async grant({ entityId, roleId }: { entityId: string; roleId: string }) {
    const role = await this.get({ id: roleId });
    let def = getEntityDef(entityId);
    if (!def) {
      throw new Error(`Entity not found ${entityId}`);
    }
    const entity = await this.em.getRepository<StandardBaseEntity>(def.Entity).findOneOrFail(entityId);
    await this.em.getRepository(AuthEntityRoleEntity).upsert({
      tid: role.tid,
      related: role,
      entityId: entity.id,
      entityType: def.typeName,
    });

    return {
      entity,
      role,
    };
  }
}
