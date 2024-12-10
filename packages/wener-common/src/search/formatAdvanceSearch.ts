import { match } from 'ts-pattern';
import { AdvanceSearch } from './AdvanceSearch';

export function formatAdvanceSearch(input: AdvanceSearch.Expr[]) {
  const OP = {
    match: ':',
    eq: ':=',
    ne: ':!=',
    gt: ':>',
    lt: ':<',
    gte: ':>=',
    lte: ':<=',
    range: ':',
  } as const;

  const _exprs = (s: AdvanceSearch.Expr[]): string => {
    return s.map(_expr).join(' ');
  };
  const _expr = (s: AdvanceSearch.Expr): string => {
    return match(s)
      .with({ type: 'keyword' }, ({ value, exact, negative }) => {
        return `${negative ? '-' : ''}${exact ? `"${value}"` : value}`;
      })
      .with({ type: 'logical' }, ({ operator, value }) => value.map(_expr).join(` ${operator.toLocaleUpperCase()} `))
      .with({ type: 'not' }, ({ value }) => `NOT ${_expr(value)}`)
      .with({ type: 'compare' }, ({ field, operator, value, negative, mention }) => {
        return `${negative ? '-' : ''}${mention ? '@' : ''}${field}${OP[operator]}${_value(value)}`;
      })
      .with({ type: 'comment' }, ({ value }) => `/* ${value} */`)
      .with({ type: 'parentheses' }, ({ value }) => `(${_exprs(value)})`)
      .exhaustive();
  };

  const _literal = (s: string | null | number) => {
    if (typeof s === 'string') {
      return s.includes(' ') ? `"${s}"` : s;
    }
    return JSON.stringify(s);
  };
  const _value = (v: AdvanceSearch.Value): string => {
    return match(v)
      .with({ type: 'range' }, ({ minimum, maximum, minimumExclusive, maximumExclusive }) => {
        if (minimumExclusive === undefined && maximumExclusive === undefined) {
          let min = minimum === undefined ? '*' : _value(minimum);
          let max = maximum === undefined ? '*' : _value(maximum);
          return `${min}..${max}`;
        }
        let min = minimum === undefined ? '' : _value(minimum);
        let max = maximum === undefined ? '' : _value(maximum);
        return `${minimumExclusive ? '(' : '['}${min},${max}${maximumExclusive ? ')' : ']'}`;
      })
      .with({ format: 'mention' }, ({ value }) => {
        return `@${value}`;
      })
      .otherwise((value) => {
        return _literal(value.value);
      });
  };

  return _exprs(input);
}
