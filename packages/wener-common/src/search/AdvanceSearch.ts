import { formatAdvanceSearch } from './formatAdvanceSearch';
import { optimizeAdvanceSearch } from './optimizeAdvanceSearch';
import { parseAdvanceSearch } from './parseAdvanceSearch';
import type * as types from './types';

export namespace AdvanceSearch {
  export type Exprs = types.Exprs;
  export type Expr = types.Expr;
  export type Value = types.Value;

  export const parse = parseAdvanceSearch;
  export const format = formatAdvanceSearch;
  export const optimize = optimizeAdvanceSearch;
}
