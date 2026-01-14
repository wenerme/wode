import type { AnyDocumentQuery } from './types';

export type FormatDocumentQueryOptions = {
	/**
	 * handle `{$text:{$search: 'query'}}`
	 */
	onSearch?: (query: string, ctx: { filters: string[] }) => void;
};

export function formatDocumentQuery(o: AnyDocumentQuery, _opts?: FormatDocumentQueryOptions): string[] {
	return _format(o, { root: o, path: [], out: [] });
}

function formatValue(v: any): string {
	if (Array.isArray(v)) {
		return `(${v.map(formatValue).join(', ')})`;
	}
	return JSON.stringify(v);
}

export const IgnoreKeyPrefix = '$$';
export const DisableKey = '$$disable';

function _format(o: any, ctx: { root: any; field?: string; path: string[]; out: string[] }): string[] {
	if (o === undefined || o === null || (typeof o === 'object' && o[DisableKey] === true)) {
		return ctx.out;
	}

	if (Array.isArray(o)) {
		for (let v of o) {
			_format(v, ctx);
		}
		return ctx.out;
	}

	if (typeof o !== 'object') {
		throw new Error(`Invalid query: ${o}`);
	}

	const { field: _field, path, out } = ctx;

	for (const [k, v] of Object.entries(o).sort((a, b) => a[0].localeCompare(b[0]))) {
		if (v === undefined || k.startsWith(IgnoreKeyPrefix)) {
			continue;
		}

		if (k.startsWith('$')) {
			const field = path.join('.');
			switch (k) {
				case '$or':
				case '$and':
				case '$nor': {
					const queries = Array.isArray(v) ? v : Object.values(v || {});
					const all = queries.map((vv: any) => formatDocumentQuery(vv)).filter(Boolean);
					if (all.length > 0) {
						const op = k === '$and' ? 'AND' : 'OR';
						const joined = all.length > 1 ? `(${all.join(` ${op} `)})` : all[0];
						out.push(k === '$nor' ? `NOT (${joined})` : (joined as string));
					}
					break;
				}
				case '$not': {
					let all = _format(v, { ...ctx, out: [] });
					if (all.length === 0) {
					} else if (all.length === 1) {
						out.push(`NOT (${all[0]})`);
					} else {
						out.push(`NOT (${all.map((v) => `(${v})`).join(` AND `)})`);
					}
					break;
				}
				case '$exists':
					out.push(`${field} IS ${v ? 'NOT NULL' : 'NULL'}`);
					break;
				case '$size':
					out.push(`LENGTH(${field}) = ${v}`);
					break;
				// case '$all':
				//   if (!Array.isArray(v)) throw new Error('$all requires an array');
				//   v.forEach((item) => out.push(`CONTAINS(${field}, ${formatValue(item)})`));
				//   break;
				// case '$elemMatch': {
				//   const subQuery = formatDocumentQuery(v!);
				//   if (subQuery) {
				//     out.push(`ELEM_MATCH(${field}, '${subQuery.replace(/'/g, "''")}')`);
				//   }
				//   break;
				// }
				default: {
					const op = InfixOperator[k.slice(1)];
					if (op && field) {
						out.push(`${field} ${op} ${formatValue(v)}`);
					} else {
						throw new Error(`Unsupported operator: ${k} at path ${field}`);
					}
				}
			}
			continue;
		}

		const segments = k.split('.');
		const currentPath = [...path, ...segments];
		const field = currentPath.join('.');

		if (v === null) {
			out.push(`${field} IS NULL`);
		} else if (Array.isArray(v)) {
			out.push(`${field} IN ${formatValue(v)}`);
		} else if (typeof v === 'object') {
			_format(v, { ...ctx, path: currentPath });
		} else {
			out.push(`${field} = ${formatValue(v)}`);
		}
	}
	return out;
}

const InfixOperator: Record<string, string> = {
	eq: '=',
	ne: '!=',
	gt: '>',
	gte: '>=',
	lt: '<',
	lte: '<=',
	in: 'IN',
	nin: 'NOT IN',
	like: 'LIKE',
	nlike: 'NOT LIKE',
	regex: 'RLIKE',
	// type: 'TYPE',
	// expr: 'EXPR',
};
