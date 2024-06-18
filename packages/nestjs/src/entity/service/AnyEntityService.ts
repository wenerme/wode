import { RequiredEntityData } from '@mikro-orm/core';
import type { EntityManager, EntityRepository, MikroORM } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Errors } from '@wener/utils';
import { getEntityDef } from '../defineEntity';
import { StandardBaseEntity } from '../StandardBaseEntity';
import { EntityBaseService } from './EntityBaseService';
import { EntityService, HasOwnerEntityService, HasStatusEntityService, SetEntityStatusRequest } from './services';
import {
  AssignOwnerRequest,
  ClaimOwnerRequest,
  CountEntityRequest,
  CreateEntityRequest,
  DeleteEntityRequest,
  GetEntityRequest,
  ListEntityRequest,
  PatchEntityRequest,
  ReleaseOwnerRequest,
  ResolveEntityRequest,
  UpdateEntityRequest,
} from './types';

type IAnyEntityService = EntityService<StandardBaseEntity> &
  HasOwnerEntityService<StandardBaseEntity> &
  HasStatusEntityService<StandardBaseEntity>;

@Injectable()
export class AnyEntityService
  implements
    EntityService<StandardBaseEntity>,
    HasOwnerEntityService<StandardBaseEntity>,
    HasStatusEntityService<StandardBaseEntity>
{
  readonly Entity = StandardBaseEntity;

  constructor(
    protected readonly orm: MikroORM,
    readonly em: EntityManager = orm.em,
  ) {}

  get repo(): EntityRepository<StandardBaseEntity> {
    throw Errors.NotImplemented.throw();
  }

  create(req: CreateEntityRequest & { data: RequiredEntityData<StandardBaseEntity> }): Promise<StandardBaseEntity> {
    throw Errors.NotImplemented.throw();
  }

  list(req: ListEntityRequest): Promise<{ total: number; data: StandardBaseEntity[] }> {
    throw Errors.NotImplemented.throw();
  }

  find(req: ListEntityRequest): Promise<StandardBaseEntity[]> {
    throw Errors.NotImplemented.throw();
  }

  count(req: CountEntityRequest): Promise<number> {
    throw Errors.NotImplemented.throw();
  }

  patch(req: PatchEntityRequest) {
    return this.getEntityService(req).patch(req);
  }

  update(req: UpdateEntityRequest & { data: Partial<StandardBaseEntity> }): Promise<StandardBaseEntity> {
    return this.getEntityService(req).update(req);
  }

  getEntityService({ id }: { id?: string | undefined }): IAnyEntityService {
    const def = getEntityDef(id);
    if (!def) {
      throw new Error(`Invalid entity id: ${id}`);
    }
    let service = EntityBaseService.getService<IAnyEntityService>(def.Entity);
    if (!service) {
      throw new Error(`Entity service not found: ${id}`);
    }
    return service;
  }

  get(req: GetEntityRequest) {
    return this.getEntityService(req).get(req);
  }

  resolve(req: ResolveEntityRequest) {
    return this.getEntityService(req).resolve(req);
  }

  claimOwner(req: ClaimOwnerRequest) {
    return this.getEntityService(req).claimOwner(req);
  }

  releaseOwner(req: ReleaseOwnerRequest) {
    return this.getEntityService(req).releaseOwner(req);
  }

  assignOwner(req: AssignOwnerRequest) {
    return this.getEntityService(req).assignOwner(req);
  }

  delete(req: DeleteEntityRequest) {
    return this.getEntityService(req).delete(req);
  }

  async setStatus(req: SetEntityStatusRequest) {
    const es = this.getEntityService(req);
    if ('setStatus' in es) {
      return es.setStatus(req);
    }

    // fixme add comment
    const entity = await es.update({
      id: req.id,
      data: {
        status: req.status,
      },
    });
    return entity;
  }
}
