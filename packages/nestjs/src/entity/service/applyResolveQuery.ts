import type { QueryBuilder } from '@mikro-orm/postgresql';
import { isUUID } from '@wener/utils';
import { isEntityTypeId } from '../parseEntityTypeId';
import { ResolveEntityRequest } from './types';

function normalizeResolveQuery(output: ResolveEntityRequest) {
  if (isUUID(output.id) && !output.uid) {
    output.uid = output.id;
    delete output.id;
  }
  if (!isEntityTypeId(output.id)) {
    delete output.id;
  }
  return output;
}

export function applyResolveQuery<T extends QueryBuilder<any>>({
  builder,
  query,
}: {
  builder: T;
  query: { id?: string; uid?: string; eid?: string; deleted?: boolean; sid?: number };
}) {
  const { id, uid, eid, cid, rid } = normalizeResolveQuery(query);
  const valid = [id, uid, eid, cid && rid].some(Boolean);
  if (!valid) {
    return false;
  }

  // Errors.BadRequest.check(!rest.id && !rest.uid && !rest.eid && !rest.sid, 'Invalid resolve query');
  // trim empty
  builder.andWhere(Object.fromEntries(Object.entries({ id, uid, eid, cid, rid }).filter(([k, v]) => v)));

  return true;
}

export function applySelection<T extends QueryBuilder<any>>({
  builder,
  query,
}: {
  builder: T;
  query: { deleted?: boolean; select?: string[]; include?: string[] };
}) {
  const { select, include, deleted } = query;
  if (deleted) {
    builder.andWhere({
      deletedAt: { $ne: null },
    });
  } else {
    builder.andWhere({
      deletedAt: null,
    });
  }

  // if (select?.length) {
  //   builder.addSelect(select);
  // }
  // if (include?.length) {
  //   console.log(`Apply include ${include}`)
  //   builder = builder.populate(include.map((field) => ({ field,all: true })));
  // }

  return builder;
}
