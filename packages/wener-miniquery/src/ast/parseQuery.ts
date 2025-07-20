import { parse } from './parser';
import type { Expr } from './types';

export function parseQuery(query: string) {
	return parse(query) as Expr;
}
