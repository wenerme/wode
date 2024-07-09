import { EntityClass, EntityProps, FilterQuery, FindOneOptions } from '@mikro-orm/postgresql';
import { Features } from '../../Feature';
import { EntityFeature } from '../enum';
import { StandardBaseEntity } from '../StandardBaseEntity';
import { AnyStandardEntity } from '../types';
import { resolveEntityContext, ResolveEntityContextOptions } from './resolveEntityContext';

export type ResolveEntityOptions<E extends StandardBaseEntity, O extends {} = {}> =
  | (BuildResolveEntityOptions & {
      entity?: E;
      where?: FilterQuery<E>;
      resolve?: (o: O & BuildResolveEntityOptions, ctx: { where: FilterQuery<E>[] }) => void;
    } & O)
  | E;

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
  code?: string;
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
  } else if (opts.code && Features.hasFeature(Entity, EntityFeature.HasCode)) {
    where['code'] = opts.code;
  } else if ((opts.cid || opts.rid) && Features.hasFeature(Entity, EntityFeature.HasVendorRef)) {
    opts.cid && (where['cid'] = opts.cid);
    opts.rid && (where['rid'] = opts.rid);
  } else {
    return {
      where: where as any,
      hasWhere: false,
    };
  }
  return { where: where as any, hasWhere: true };
}

export async function resolveEntity<E extends StandardBaseEntity>(
  opts: ResolveEntityOptions<E>,
  contextOptions: ResolveEntityContextOptions<E>,
  pass?: FindOneOptions<E>,
): Promise<ResolveEntityResult<E>> {
  if (opts instanceof StandardBaseEntity) {
    return { entity: opts };
  }
  const { repo, def, Entity } = resolveEntityContext(contextOptions);
  if (opts.entity) {
    return { entity: opts.entity };
  }

  let entity: E | null;

  const where: FilterQuery<E>[] = [];
  {
    const out = buildResolveEntityWhere(Entity, opts);
    if (out.hasWhere) {
      where.push(out.where);
    }
    if (opts.where) {
      where.push(opts.where);
    }
    if (opts.resolve) {
      opts.resolve(opts, { where });
    }
  }

  if (where.length) {
    entity = await repo.findOne(where, pass);
  } else {
    return {};
  }
  return { entity };
}
