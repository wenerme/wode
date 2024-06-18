import { EntityClass, EntityProps, FilterQuery } from '@mikro-orm/postgresql';
import { Features } from '../../Feature';
import { EntityFeature } from '../enum';
import { StandardBaseEntity } from '../StandardBaseEntity';
import { AnyStandardEntity } from '../types';
import { resolveEntityContext, ResolveEntityContextOptions } from './resolveEntityContext';

export interface ResolveEntityOptions<E extends StandardBaseEntity> extends BuildResolveEntityOptions {
  entity?: E;
  where?: FilterQuery<E>;
}

export interface ResolveEntityResult<E extends StandardBaseEntity> {
  entity?: E | null;
}

interface BuildResolveEntityOptions {
  id?: string;
  sid?: number;
  uid?: string;
  eid?: string;
  cid?: string;
  rid?: string;
}

export function buildResolveEntityWhere<E>(
  Entity: EntityClass<E>,
  opts: BuildResolveEntityOptions,
): {
  where: FilterQuery<E> & EntityProps<E>;
  hasWhere: boolean;
} {
  const where: FilterQuery<AnyStandardEntity> = {};
  if (opts.id) {
    where['id'] = opts.id;
  } else if (opts.uid) {
    where['uid'] = opts.uid;
  } else if (opts.eid) {
    where['eid'] = opts.eid;
  } else if (opts.sid && Features.hasFeature(Entity, EntityFeature.HasSid)) {
    where['sid'] = opts.sid;
  } else if (opts.cid && opts.rid && Features.hasFeature(Entity, EntityFeature.HasVendorRef)) {
    where['cid'] = opts.cid;
    where['rid'] = opts.rid;
  } else {
    return {
      where: where as any,
      hasWhere: false,
    };
  }
  return { where: where as any, hasWhere: true };
}

export async function resolveEntity<E extends StandardBaseEntity>(
  req: ResolveEntityOptions<E>,
  opts: ResolveEntityContextOptions<E>,
): Promise<ResolveEntityResult<E>> {
  const { repo, def, Entity } = resolveEntityContext(opts);
  if (req.entity) {
    return { entity: req.entity };
  }

  let entity: E | null;

  const where: FilterQuery<E> = [];
  {
    const out = buildResolveEntityWhere(Entity, req);
    if (out.hasWhere) {
      where.push(out.where);
      if (req.where) {
        where.push(req.where);
      }
    }
  }

  if (where.length) {
    entity = await repo.findOne(where);
  } else {
    return {};
  }
  return { entity };
}
