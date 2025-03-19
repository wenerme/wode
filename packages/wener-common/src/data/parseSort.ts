import { arrayOfMaybeArray, type MaybeArray } from '@wener/utils';

export type SortRule = { field: string; order: 'asc' | 'desc'; nulls?: 'last' | 'first' };

/**
 * Parses various format of sort specifications into standardized SortRule objects
 *
 * Supported formats:
 * - "field asc|desc"
 * - "field asc|desc nulls first|last"
 * - "+field" for ascending, "-field" for descending
 * - Object notation: { field: string, order?: string, nulls?: string }
 *
 * @example
 * parseSort('name desc')               // [{ field: 'name', order: 'desc' }]
 * parseSort('+name,-age')              // [{ field: 'name', order: 'asc' }, { field: 'age', order: 'desc' }]
 * parseSort('name asc nulls last')     // [{ field: 'name', order: 'asc', nulls: 'last' }]
 * parseSort([{ field: 'name' }])       // [{ field: 'name', order: 'asc' }]
 */
export function parseSort(
	order: MaybeArray<{ field?: string; order?: string; nulls?: string } | string> | undefined | null,
): SortRule[] {
	if (!order) {
		return [];
	}

	return arrayOfMaybeArray(order).flatMap((v): MaybeArray<SortRule> => {
		if (!v) return [];
		if (typeof v === 'object') {
			if (!v.field) {
				return [];
			}
			const rule: SortRule = {
				field: v.field,
				order: normalizeOrder(v.order),
			};

			if (v.nulls) {
				rule.nulls = normalizeNulls(v.nulls);
			}
			return rule;
		}
		return v
			.split(',')
			.map((v) => v.trim())
			.filter(Boolean)
			.map(_parse);
	});
}

/**
 * Normalizes order values to 'asc' or 'desc'
 */
function normalizeOrder(order?: string): SortRule['order'] {
	return order?.toLowerCase() === 'asc' ? 'asc' : 'desc';
}

/**
 * Normalizes nulls values to 'last' or 'first'
 */
function normalizeNulls(nulls?: string): SortRule['nulls'] {
	return nulls?.toLowerCase() === 'last' ? 'last' : 'first';
}

function _parse(v: string): SortRule {
	const sp = v.split(/\s+/);
	let field = '';
	let order: SortRule['order'];
	let nulls: SortRule['nulls'];

	// Handle first token which should be the field name (possibly with +/- prefix)
	const f = sp.shift();
	if (!f) return { field: '', order: 'asc' }; // Defensive programming

	if (f.startsWith('-') || f.startsWith('+')) {
		field = f.slice(1).trim();
		order = f.startsWith('-') ? 'desc' : 'asc';
	} else {
		field = f.trim();
	}

	// Process remaining tokens
	while (sp.length > 0) {
		const token = sp.shift()?.trim()?.toLowerCase();
		if (!token) continue;

		switch (token) {
			case 'asc':
			case 'desc':
				order = token;
				break;

			case 'nulls':
				nulls = sp.shift()?.trim()?.toLowerCase() === 'last' ? 'last' : 'first';
				break;

			case 'last':
			case 'first':
				nulls = token;
				break;
		}
	}

	order ||= 'asc';

	// Only include nulls if specified
	return nulls ? { field, order, nulls } : { field, order };
}
