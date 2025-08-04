import { parse } from './parser';
import type { SearchExpr } from './types';

export function parseSearch(s: string | undefined | null): SearchExpr {
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
				return { type: 'keyword', value: v };
			});
	}

	return parse(s);
}
