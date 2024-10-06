/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  col,
  DataTypes,
  fn,
  Op,
  where,
  type Association,
  type DataType,
  type Includeable,
  type IncludeOptions,
  type Model,
  type ModelStatic,
  type Sequelize,
  type WhereOptions,
} from '@sequelize/core';
import type { MatchResult } from 'ohm-js';
import { toMiniQueryAST, type MiniQueryASTNode } from '../ast';

export interface SequelizeWhereOptions {
  sequelize: Sequelize;
  Model: ModelStatic<Model>;
  where?: WhereOptions[];
  include?: IncludeOptions[];
  // whitelist function calls
  functions?: Record<
    string,
    {
      arity?: number;
    }
  >;
}

type WhereContext = Omit<SequelizeWhereOptions, 'functions'> & {
  current?: any;
  functions: Record<
    string,
    {
      arity?: number;
    }
  >;
  include: Includeable[];
  associations: Association[];
};

export function toSequelizeWhere(
  s: string | MatchResult,
  o: SequelizeWhereOptions,
): { where: WhereOptions; include: IncludeOptions[] } {
  const ctx = { functions: DefaultFunctions, include: [], associations: [], ...o };

  if (!s) {
    return {
      where: {},
      include: [],
    };
  }
  const where = toWhere(toMiniQueryAST(s), ctx);
  ctx.include.push(...ctx.associations);
  return { where, include: ctx.include };
}

const DefaultFunctions: WhereContext['functions'] = {
  date: { arity: 1 },
  length: { arity: 1 },
};

function checkFunctions(name: string, args: any[] = [], o: WhereContext) {
  if (!o.functions[name]) {
    throw new Error(`Invalid function: ${name}`);
  }
}

function isSameType(a: DataType, b: DataType) {
  return a === b || keyOfDataType(a) === keyOfDataType(b);
}

function keyOfDataType(d: DataType) {
  if (typeof d === 'string') {
    return d.toUpperCase();
  }
  return d;
  // if ('key' in d) {
  //   // v7 removed
  //   // return d.key;
  //   // return d.usageContext?.model.name
  //   return d
  // }
  // // fixme
  // return d.name;
}

function resolve(parts: string[], c: WhereContext) {
  const { Model } = c;
  let M = Model;
  const rest = [...parts];

  const all: string[] = [];
  let isAssoc = false;
  let include: IncludeOptions | undefined;

  while (rest.length) {
    const first = rest.shift() as string;
    const attr = M.getAttributes()[first];
    if (attr) {
      if (isSameType(attr.type, DataTypes.JSON) || isSameType(attr.type, DataTypes.JSONB)) {
        all.push(attr.field!);
        all.push(...rest);
        break;
      } else if (rest.length === 0) {
        all.push(attr.field!);
        break;
      } else {
        throw new SyntaxError(`Invalid ref of attr: ${parts.join('.')} type of ${attr.field} is ${attr.type}`);
      }
    } else if (rest.length === parts.length - 1) {
      // first
      // User.createdAt
      if (first === M.name) {
        // todo should add a prefix to prevent ambiguous
        // all.push(first)
        continue;
      }
    }

    const assoc = M.associations[first];
    if (assoc) {
      if (assoc.isMultiAssociation) {
        throw new Error(`Use has for multi association: ${parts.join('.')}`);
      }
      if (!include) {
        include = {
          association: assoc,
          required: true,
        };
        c.include.push(include);
      } else {
        // nested
        include.include = [
          {
            association: assoc,
            required: true,
          },
        ];
      }

      all.push(first);
      M = assoc.target;
      if (!rest.length) {
        throw new SyntaxError(`Invalid ref of an association: ${parts.join('.')}`);
      }
      isAssoc = true;
      continue;
    }

    throw new SyntaxError(`Invalid ref: ${parts.join('.')} of model ${M.name}`);
  }
  if (isAssoc) {
    return `$${all.join('.')}$`;
  }
  return all.join('.');
}

function toWhere(ast: MiniQueryASTNode, o: WhereContext): any {
  let current = o.current ?? {};
  const { Model } = o;

  function attrOfIdentifier(name: string) {
    // can support auto case convert

    const attr = Model.getAttributes()[name];
    if (!attr?.field) {
      throw new Error(`Invalid attribute: ${name}`);
    }
    return attr;
  }

  const setOp = (left: MiniQueryASTNode, op: any, val: any) => {
    if (typeof op === 'string') {
      op = opOf(op);
    }
    let v: any;
    switch (left.type) {
      case 'identifier':
        v = current[attrOfIdentifier(left.name).field!] ??= {};
        break;
      case 'call': {
        const first = left.value[0];
        if (left.value.length !== 1) {
          throw new SyntaxError(`Expected 1 call args, got ${left.value.length}`);
        }
        let cn: string;
        switch (first.type) {
          case 'identifier':
            cn = attrOfIdentifier(first.name).field!;
            break;
          case 'ref':
            // fixme hack replace
            cn = resolve(first.name, o).replaceAll(`$`, '`');
            break;
          default:
            throw new SyntaxError(`Expected identifier or ref for call, got ${first.type}`);
        }

        const name = left.name.toLowerCase();
        checkFunctions(name, [first], o);
        current = where(fn(name, col(cn)), {
          [op]: val,
        });
        return;
      }
      case 'ref':
        // 依然无法 escape `.`
        // https://sequelize.org/docs/v7/core-concepts/model-querying-basics/#querying-json
        // v = _.get(current, left.name);
        // if (!v) {
        //   v = {};
        //   _.set(current, left.name, v);
        // }
        v = current[resolve(left.name, o)] ??= {};
        break;
      default:
        throw new SyntaxError(`Expected identifier, ref or call for left side, got ${left.type}`);
    }
    v[op] = val;
  };

  switch (ast.type) {
    case 'rel':
      {
        setOp(ast.a, ast.op, toWhere(ast.b, { ...o }));
      }
      break;
    case 'between':
      {
        setOp(ast.a, ast.op, [toWhere(ast.b, { ...o }), toWhere(ast.c, { ...o })]);
      }
      break;
    case 'logic':
      {
        const op = opOf(ast.op);
        const c = (current[op] ??= []);
        // collect - flat - optimize
        const a = toWhere(ast.a, { ...o });
        if (a[op]) {
          c.push(...a[op]);
        } else {
          c.push(a);
        }
        const b = toWhere(ast.b, { ...o });
        if (b[op]) {
          c.push(...b[op]);
        } else {
          c.push(b);
        }
      }
      break;

    case 'paren':
      return [toWhere(ast.value, { ...o })];
    case 'int':
    case 'string':
    case 'float':
      return ast.value;
    case 'null':
      return null;
    case 'call': {
      const name = ast.name.toLowerCase();
      checkFunctions(name, ast.value, o);
      return fn(name, ...ast.value.map((v) => toWhere(v, { ...o })));
    }
    case 'identifier': {
      const attr = attrOfIdentifier(ast.name);
      return col(attr.field!);
    }
    default:
      throw new SyntaxError(`Invalid type: ${ast.type}`);
  }
  return current;
}

const OpMap: Record<string, string> = {
  'not between': 'notBetween',
  'not like': 'notLike',
  ilike: 'iLike',
  'not ilike': 'notILike',
  'not in': 'notIn',
  'is not': 'not',
};

function opOf(v: string) {
  const op = Op[(OpMap[v] || v) as 'any'];
  if (!op) {
    throw new SyntaxError(`Unsupported operator: ${v}`);
  }
  return op;
}
