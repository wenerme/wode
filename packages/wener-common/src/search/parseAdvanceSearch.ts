import { AdvanceSearch } from './AdvanceSearch';
import { parse } from './parser';

export function parseAdvanceSearch(s: string | undefined | null): AdvanceSearch.Expr[] {
  s = s?.trim();
  if (!s) {
    return [];
  }

  // no Logical, no Compare, no Quote, no Comment
  if (!/AND|OR|NOT|[-"():]|\/\*/.test(s)) {
    // fast path
    return s
      .split(/\s+/)
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => {
        return {
          type: 'keyword',
          value: v,
        };
      });
  }

  return parse(s);
}
