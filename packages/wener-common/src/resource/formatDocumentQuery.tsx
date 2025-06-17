export function formatDocumentQuery(o: any): string[] {
	if (!o) return [];

	return _format(o, {
		root: o,
		path: [],
		out: [],
	});
}

function _format(o: any, ctx: { root: any; field?: string; path: string[]; out: string[] }) {
	// allow to skip the query
	if (o === undefined || o === null || (typeof o === 'object' && o[DocumentQueryDisableKey] === true)) {
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

	const { field, path, out } = ctx;

	// more stable
	for (let [k, v] of Object.entries(o).sort((a, b) => a[0].localeCompare(b[0]))) {
		if (v === undefined) {
			continue;
		}

		if (k.startsWith(IgnoreKeyPrefix)) {
			continue;
		}
		// handle operator key
		if (k.startsWith('$')) {
			switch (k) {
				case '$or':
				case '$and': {
					// support object
					let all = Object.values(v ?? []).flatMap((vv: any) => formatDocumentQuery(vv));
					if (all.length === 0) {
					} else if (all.length === 1) {
						out.push(all[0]);
					} else {
						out.push(`(${all.join(` ${k === '$and' ? 'AND' : 'OR'} `)})`);
					}
					break;
				}
				case '$not': {
					let all = _format(v, { ...ctx, out: [] });
					if (all.length === 0) {
					} else if (all.length === 1) {
						out.push(`NOT ${all[0]}`);
					} else {
						out.push(`NOT (${all.join(` AND `)})`);
					}
					break;
				}
				default: {
					const op = InfixOperator[k.slice(1)];
					if (op) {
						if (!field) {
							throw new Error(`Invalid query: ${k}`);
						}
						out.push(`${field} ${op} ${JSON.stringify(v)}`);
						continue;
					}

					throw new Error(`not supported: ${k}`);
				}
			}
			continue;
		}

		switch (v) {
			case undefined:
				break;
			case null:
				out.push(`${k} IS NULL`);
				break;
			default:
				let _path = [...path, k];
				let _field = _path.join('.');
				if (Array.isArray(v)) {
					out.push(`${_field} IN ${JSON.stringify(v.toSorted())}`);
				} else if (typeof v !== 'object') {
					out.push(`${_field} = ${JSON.stringify(v)}`);
				} else if (typeof v === 'object') {
					_format(v, {
						...ctx,
						path: _path,
						field: _field,
					});
				}
				break;
		}
	}
	return out;
}

const IgnoreKeyPrefix = '$$';

export const DocumentQueryDisableKey = '$$disable';

const InfixOperator: Record<string, any> = {
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
};

type DocumentQueryObject = Record<string, any>;

// maybe support normalize between to gte lte

function resolveDocumentQuery(o: any) {}
