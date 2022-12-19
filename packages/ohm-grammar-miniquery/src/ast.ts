import type { ActionDict, IterationNode, MatchResult } from 'ohm-js';
import { MiniQueryGrammar, MiniQuerySemantics } from './grammar';

export type MiniQueryASTNode =
  | {
      type: 'identifier';
      name: string;
    }
  | {
      type: 'logic';
      op: 'and' | 'or';
      a: MiniQueryASTNode;
      b: MiniQueryASTNode;
    }
  | {
      type: 'rel';
      op: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne' | 'like' | 'has' | 'in' | 'not in' | 'not like' | 'is' | 'is not';
      a: MiniQueryASTNode;
      b: MiniQueryASTNode;
    }
  | {
      type: 'between';
      op: 'between' | 'not between';
      a: MiniQueryASTNode;
      b: MiniQueryASTNode;
      c: MiniQueryASTNode;
    }
  | {
      type: 'call';
      name: string;
      value: MiniQueryASTNode[];
    }
  | {
      type: 'unary';
      op: 'pos' | 'neg' | 'not';
      value: MiniQueryASTNode;
    }
  | {
      type: 'paren';
      value: MiniQueryASTNode;
    }
  | {
      type: 'array';
      value: MiniQueryASTNode[];
    }
  | {
      type: 'int';
      value: number;
    }
  | {
      type: 'float';
      value: number;
    }
  | {
      type: 'string';
      value: string;
    }
  | {
      type: 'null';
    }
  | {
      type: 'bool';
      value: boolean;
    }
  | {
      type: 'ref';
      name: string[];
    };

const Ops: Record<string, string> = {
  '&&': 'and',
  '||': 'or',
  '=': 'eq',
  '==': 'eq',
  '!=': 'ne',
  '<>': 'ne',
  '>': 'gt',
  '>=': 'gte',
  '<': 'lt',
  '<=': 'lte',
  ':': 'has',
};

export function getMiniQueryASTOp(v: string) {
  const s = v.toLowerCase().trim().replaceAll(/\s+/g, ' ');
  return Ops[s] || s;
}

const actions: ActionDict<any> = {
  nonEmpty(first, _, rest: IterationNode, _pad) {
    return [first].concat(rest.children).map((v) => v.toAST());
  },
  rel(a, op, b) {
    let v = op.sourceString;
    if (op.isIteration()) {
      v = op.children.map((vv) => vv.sourceString).join(' ');
    }
    return {
      type: 'rel',
      op: getMiniQueryASTOp(v) as any,
      a: a.toAST(),
      b: b.toAST(),
      v: 'bool',
    };
  },
  empty() {
    return [];
  },
};

export function toMiniQueryAST(s: string | MatchResult) {
  let match: MatchResult;
  if (typeof s === 'string') {
    match = MiniQueryGrammar.match(s);
  } else {
    match = s;
  }
  if (match.failed()) {
    throw new SyntaxError(`Invalid MiniQuery: ${match.message}`);
  }
  return MiniQuerySemantics(match).toAST();
}

MiniQuerySemantics.addOperation<MiniQueryASTNode>('toAST()', {
  Main(expr, _) {
    return expr.toAST();
  },
  LogicExpr_match(a, op, b) {
    return {
      type: 'logic',
      op: getMiniQueryASTOp(op.sourceString) as any,
      a: a.toAST(),
      b: b.toAST(),
      v: 'bool',
    };
  },
  RelExpr_match: actions.rel,
  RelExpr_match_eq: actions.rel,
  RelExpr_has: actions.rel,
  InExpr_match: actions.rel,
  PredicateExpr_like: actions.rel,
  PredicateExpr_is: actions.rel,
  BetweenExpr_match(a, op, b, _, c) {
    return {
      type: 'between',
      op: op.sourceString as any,
      a: a.toAST(),
      b: b.toAST(),
      c: c.toAST(),
      v: 'bool',
    };
  },
  CallExpr_match(n, _, v, _end) {
    return { type: 'call', name: n.sourceString, value: v.toAST() };
  },
  PriExpr_paren(_, v, _end) {
    return { type: 'paren', value: v.toAST() };
  },
  PriExpr_not(op, v) {
    return { type: 'unary', op: getMiniQueryASTOp(op.sourceString) as any, value: v.toAST(), v: 'bool' };
  },
  PriExpr_pos(op, v) {
    return { type: 'unary', op: getMiniQueryASTOp(op.sourceString) as any, value: v.toAST() };
  },
  PriExpr_neg(op, v) {
    return { type: 'unary', op: getMiniQueryASTOp(op.sourceString) as any, value: v.toAST() };
  },
  Array(_, list, _end) {
    return { type: 'array', value: list.toAST(), v: Array };
  },
  int: (s, _, v) => {
    return { type: 'int', value: parseInt(`${s.sourceString || ''}${v.sourceString}`), v: 'int' };
  },
  float: (i, _, f) => {
    return { type: 'float', value: parseFloat(`${i?.sourceString || 0}.${f.sourceString}`), v: Number };
  },
  string: (_, v, _end) => {
    return { type: 'string', value: v.sourceString, v: 'string' };
  },
  ident: (a, b) => {
    return { type: 'identifier', name: [a, b].map((v) => v.sourceString).join('') };
  },
  null: (_) => {
    return { type: 'null', v: 'null' };
  },
  bool: (v) => {
    return { type: 'bool', value: v.sourceString.toLowerCase() === 'true', v: 'bool' };
  },
  ref(a, b, c: IterationNode) {
    return {
      type: 'ref',
      name: [a.sourceString].concat(
        c.children.map((v) => {
          const ast = v.toAST();
          return ast.name || ast.value;
        }),
      ),
    };
  },
  TrailNonEmptyListOf: actions.nonEmpty,
  EmptyListOf: actions.empty,
});
