import type { SortRule } from './parseSort';

export function formatSort(s: SortRule[]): string[] {
	return s
		.map(({ field, order, nulls }) => {
			if (!field) return '';

			let r = field;
			if (order) {
				r += ` ${order}`;
			}
			if (nulls) {
				r += ` nulls ${nulls}`;
			}
			return r;
		})
		.filter(Boolean);
}
