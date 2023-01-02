import { toSequelizeWhere } from 'ohm-grammar-miniquery/sequelize';
import { ModelStatic, Sequelize } from '@sequelize/core';
import { WhereOptions } from '@sequelize/core/types/model';
import { TRPCError } from '@trpc/server';
import { arrayOfMaybeArray, isULID, isUUID } from '@wener/utils';
import { PageRequest, PageResponse } from '../../apis';

export interface ListQueryOptions<T extends ModelStatic> {
  input: PageRequest;
  Model: T;
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  onSearch?: BuildSearchOptions<T>['onSearch'];
}

export function createListQuery<T extends ModelStatic>({ onSearch, Model }: Omit<ListQueryOptions<T>, 'input'>) {
  return ({ input }: { input: PageRequest }) => listQueryResolver({ input, Model, onSearch });
}

async function listQueryResolver<T extends ModelStatic>({
  input: { cursor, limit, offset, search, order, deleted, filter },
  onSearch,
  Model,
}: ListQueryOptions<T>): Promise<PageResponse<InstanceType<T>>> {
  const where: WhereOptions = [];
  const bind: any[] = [];
  let Scope = Model;
  const { sequelize } = Model;
  if (!sequelize) {
    throw new Error(`Model ${Model.name} not init`);
  }
  // fixme check authz
  if (deleted) {
    Scope = Scope.scope('deleted') as any;
  }
  buildSearch({
    search,
    where,
    Model: Scope,
    onSearch,
  });

  if (filter) {
    // NOTE skip include
    const f = toSequelizeWhere(filter, { sequelize, Model });
    where.push(f.where as any);
  }
  const cursorWhere = where.concat();
  // 非常简单的 cursor 逻辑
  // fieldName:last-field-value
  if (cursor) {
    const [k, v] = cursor.split(':', 2);
    if (k && v) {
      switch (k) {
        case 'id':
          cursorWhere.push(sequelize.where(sequelize.col(k), '<', v));
          break;
        default:
          throw new TRPCError({ code: 'BAD_REQUEST', message: `invalid cursor ${cursor}` });
      }
    }
  }

  const items = await Scope.findAll({
    limit,
    offset,
    // join ASC, NULLS LAST -> ASC NULLS LAST
    order: order?.length ? order.map((v) => (v.length <= 2 ? v : [v[0], v.slice(1).join(' ')])) : ['id'],
    where: cursorWhere,
    bind,
  });
  return {
    items: items.map((v) => v.toJSON()),
    total: await Scope.count({ where }),
  } as PageResponse<InstanceType<T>>;
}

export interface BuildSearchOptions<T extends ModelStatic> {
  search?: string;
  onSearch?:
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    | ((ctx: { search: string; where: WhereOptions[]; sequelize: Sequelize; Model: T }) => boolean | void)
    | string
    | string[];
  where: WhereOptions[];
  Model: T;
}

export function buildSearch<T extends ModelStatic>({ search, where, Model, onSearch }: BuildSearchOptions<T>) {
  if (!search) {
    return false;
  }
  const { sequelize } = Model;
  if (!sequelize) {
    throw new Error(`Model ${Model.name} not init`);
  }
  if (isULID(search)) {
    where.push(sequelize.where(sequelize.col(`id`), '=', search));
    return true;
  } else if (isUUID(search)) {
    where.push(sequelize.where(sequelize.col(`uid`), '=', search));
    return true;
  }
  if (typeof onSearch === 'string' || Array.isArray(onSearch)) {
    const cols = arrayOfMaybeArray(onSearch);
    if (cols.length === 0) {
      return false;
    }
    sequelize.or(...cols.map((col) => sequelize.where(sequelize.col(col), 'like', `%${search}%`)));
    return true;
  }

  return typeof onSearch === 'function' && onSearch({ search, where, sequelize, Model });
}
