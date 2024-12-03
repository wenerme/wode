import { arrayOfMaybeArray, deepEqual, type MaybeArray } from '@wener/utils';
import { match } from 'ts-pattern';
import { AdvanceSearch } from './AdvanceSearch';

export function optimizeAdvanceSearch(expr: AdvanceSearch.Exprs): AdvanceSearch.Exprs {
  const NEG = {
    eq: 'ne',
    ne: 'eq',
    gt: 'lte',
    lt: 'gte',
    gte: 'lt',
    lte: 'gt',
  } as const;
  const _expr = (e: AdvanceSearch.Expr): MaybeArray<AdvanceSearch.Expr> => {
    // merge Exprs to AND ?
    return (
      match(e)
        // (EXPR) -> EXPR
        // TODO (EXPR EXPR) -> EXPR AND EXPR
        .with({ type: 'parentheses' }, (expr) => {
          // unwrap
          if (expr.value.length < 2) {
            return expr.value[0];
          }
          expr.value = expr.value.flatMap(_expr);
          return expr;
        })
        .with({ type: 'comment' }, (expr) => {
          // remove empty comment
          if (!expr.value.length) {
            return [];
          }
          return expr;
        })
        // NOT
        .with({ type: 'not' }, (expr) => {
          let out = arrayOfMaybeArray(_expr(expr.value));
          if (!out.length) {
            return [];
          } else if (out.length === 1) {
            expr.value = out[0];
          } else {
            throw new Error('NOT should have only one value');
          }
          return (
            match(expr.value)
              // NOT NOT EXPR -> EXPR
              .with({ type: 'not' }, (expr) => expr.value)
              // NOT EXPR -> -EXPR
              .with({ type: 'compare' }, (expr) => {
                return {
                  ...expr,
                  negative: !expr.negative,
                };
              })
              .with({ type: 'keyword' }, (expr) => {
                return {
                  ...expr,
                  negative: !expr.negative,
                };
              })
              .otherwise(() => expr)
          );
        })
        .with({ type: 'compare' }, (expr) => {
          // negative by swap operator
          if (expr.negative) {
            const ne = NEG[expr.operator as keyof typeof NEG];
            if (ne) {
              expr.operator = ne;
              expr.negative = false;
            }
          }
          if (expr.operator === 'range') {
          }
          return expr;
        })
        .otherwise((e) => e)
    );
  };

  let last = expr;
  while (true) {
    let next = structuredClone(last).flatMap(_expr);
    if (deepEqual(last, next)) {
      return last;
    }
    last = next;
  }
}
