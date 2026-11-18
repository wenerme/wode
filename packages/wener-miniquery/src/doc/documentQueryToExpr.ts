import { formatQuery, isQueryName, quoteQueryString } from '../ast/formatQuery';
import type { CompareExpr, Expr, LiteralExpr, RefExpr } from '../ast/types';
import type { AnyDocumentQuery, DocumentQueryInput } from './types';

/** Keys starting with this prefix are ignored. */
export const IgnoreKeyPrefix = '$$';
/** An object with `{ [DisableKey]: true }` is skipped, e.g. a filter group switched off in a UI. */
export const DisableKey = '$$disable';
/** MongoDB's query comment metadata; it is ignored when producing a MiniQuery expression. */
export const CommentKey = '$comment';

export type DocumentQueryOptions = {
	/**
	 * Handle `{ $text: { $search: 'query' } }`: return the condition to use, or undefined for none.
	 * Without it `$text` is rejected.
	 */
	onSearch?: (search: string) => Expr | undefined;
};

const LOGICAL = new Set(['$and', '$or', '$nor', '$not', '$text']);

const COMPARE = {
	$eq: '=',
	$ne: '!=',
	$gt: '>',
	$gte: '>=',
	$lt: '<',
	$lte: '<=',
	$like: 'LIKE',
	$nlike: 'NOT LIKE',
} as const;

type Path = string[];
const SKIP = Symbol('document-query-skip');
type Condition = Expr | typeof SKIP | undefined;
type QueryCache = {
	disabled: WeakMap<object, boolean>;
	entries: WeakMap<object, Array<[string, unknown]>>;
};

function isExpr(value: Condition | undefined): value is Expr {
	return value !== undefined && value !== SKIP;
}

/**
 * Convert a Mongo-like document query to a MiniQuery expression, or undefined when it has no condition.
 * Values follow SQL semantics: `null` is `IS NULL`, `$in` with `null` also matches `NULL`.
 * Throws for operators, values or field names MiniQuery can not express.
 */
export function documentQueryToExpr(
	query: AnyDocumentQuery | null | undefined,
	options: DocumentQueryOptions = {},
): Expr | undefined {
	const result = and(conditions(query, [], options, undefined, undefined, newQueryCache()));
	return result === SKIP ? undefined : result;
}

/** The top-level conditions of a query (combined with AND), in key order. */
export function documentQueryConditions(
	query: DocumentQueryInput | null | undefined,
	options: DocumentQueryOptions = {},
): Expr[] {
	const cache = newQueryCache();
	if (Array.isArray(query)) {
		if (isDisabled(query, cache)) return [];
		return query.flatMap((item) => conditions(item, [], options, undefined, undefined, cache)).filter(isExpr);
	}
	return conditions(query, [], options, undefined, undefined, cache).filter(isExpr);
}

function falseExpr(): LiteralExpr {
	return { type: 'literal', value: false };
}

/** AND / OR of the expressions, flattening nested operands of the same operator as the parser does. */
function logic(op: 'AND' | 'OR', exprs: Expr[]): Expr | undefined {
	const flat = exprs.flatMap((e) => (e.type === 'logic' && e.op === op ? e.exprs : [e]));
	if (flat.length < 2) return flat[0];
	return { type: 'logic', op, exprs: flat };
}

function and(exprs: Array<Condition | undefined>): Expr | typeof SKIP | undefined {
	const active = exprs.filter(isExpr);
	if (!active.length) {
		if (exprs.some((e) => e === undefined)) return undefined;
		return exprs.some((e) => e === SKIP) ? SKIP : undefined;
	}
	return logic('AND', active);
}

function not(expr: Expr): Expr {
	return { type: 'unary', op: 'NOT', expr };
}

function newQueryCache(): QueryCache {
	return { disabled: new WeakMap(), entries: new WeakMap() };
}

function isDisabled(v: unknown, cache?: QueryCache): boolean {
	if (typeof v !== 'object' || v === null) return false;
	if (cache?.disabled.has(v)) return cache.disabled.get(v)!;
	const disabled = (v as Record<string, unknown>)[DisableKey] === true;
	cache?.disabled.set(v, disabled);
	return disabled;
}

/** A plain object literal; class instances (Date, RegExp, Map, ...) are values, not queries. */
function isPlainObject(v: unknown): v is Record<string, unknown> {
	if (typeof v !== 'object' || v === null) return false;
	const proto = Object.getPrototypeOf(v);
	return proto === Object.prototype || proto === null;
}

/** Entries in key order, without ignored keys and undefined values. */
function entries(o: Record<string, unknown>, cache?: QueryCache): Array<[string, unknown]> {
	if (cache?.entries.has(o)) return cache.entries.get(o)!;
	const result = Object.keys(o)
		.filter((k) => k !== CommentKey && !k.startsWith(IgnoreKeyPrefix))
		.map((k) => [k, o[k]] as [string, unknown])
		.filter(([, v]) => v !== undefined)
		.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	cache?.entries.set(o, result);
	return result;
}

function conditions(
	query: unknown,
	path: Path,
	options: DocumentQueryOptions,
	queryEntries?: Array<[string, unknown]>,
	queryDisabled?: boolean,
	cache: QueryCache = newQueryCache(),
): Condition[] {
	if (query === undefined || query === null) return [];
	if (queryDisabled ?? isDisabled(query, cache)) return [SKIP];
	if (!isPlainObject(query)) throw new Error(`Invalid query at ${field(path) || 'root'}: expected an object`);
	const out: Condition[] = [];
	for (const [k, v] of queryEntries ?? entries(query, cache)) {
		if (k.startsWith('$')) {
			if (k === '$not' && path.length) {
				// Inside a field-relative group, `$not` is a field operator, not a query-level filter.
				out.push(...fieldConditions(path, { [k]: v }, options, undefined, undefined, cache));
			} else if (LOGICAL.has(k) || !path.length) {
				const e = logical(k, v, path, options, cache);
				out.push(e);
			} else {
				// an operator in a group under a field, as in `{ a: { $or: [{ $gt: 1 }, { $lt: 0 }] } }`
				out.push(...fieldConditions(path, { [k]: v }, options, undefined, undefined, cache));
			}
			continue;
		}
		const p = [...path, ...k.split('.')];
		const disabled = isDisabled(v, cache);
		const meaningfulEntries = !disabled && isPlainObject(v) ? entries(v, cache) : [];
		if (
			isPlainObject(v) &&
			!disabled &&
			!meaningfulEntries.some(([key]) => key.startsWith('$') && !key.startsWith(IgnoreKeyPrefix))
		) {
			// nested object: conditions on nested fields
			const nested = conditions(v, p, options, meaningfulEntries, disabled, cache);
			if (nested.length) out.push(...nested);
			else out.push(undefined);
		} else if (disabled) {
			out.push(SKIP);
		} else {
			out.push(...fieldConditions(p, v, options, meaningfulEntries, disabled, cache));
		}
	}
	return out;
}

/** `$and` / `$or` / `$nor` / `$not` / `$text` at the query level. */
function logical(
	op: string,
	v: unknown,
	path: Path,
	options: DocumentQueryOptions,
	cache: QueryCache,
): Expr | typeof SKIP | undefined {
	switch (op) {
		case '$and':
		case '$or':
		case '$nor': {
			if (!Array.isArray(v) && !isPlainObject(v)) throw new Error(`${op} requires a list or a record of queries`);
			if (isDisabled(v, cache)) return SKIP;
			// a record of named groups follows the same rules as a query: `$$` keys are metadata
			const groups = (Array.isArray(v) ? v : entries(v, cache).map(([, g]) => g)).filter(
				(g) => g !== undefined && g !== null,
			);
			const branches = groups.map((g) => {
				const disabled = isDisabled(g, cache);
				return disabled ? SKIP : and(conditions(g, path, options, undefined, disabled, cache));
			});
			if (op === '$and') return and(branches);
			// an empty branch has no condition: it matches everything
			if (branches.some((b) => b === undefined)) return op === '$or' ? undefined : falseExpr();
			if (!branches.length) return undefined;
			const active = branches.filter((b): b is Expr => b !== undefined && b !== SKIP);
			if (!active.length) return branches.some((b) => b === SKIP) ? SKIP : undefined;
			const or = logic('OR', active)!;
			return op === '$nor' ? not(or) : or;
		}
		case '$not': {
			// A disabled operand is removed; negating an active empty query means NOT TRUE = FALSE.
			const disabled = isDisabled(v, cache);
			if (disabled) return SKIP;
			const e = and(conditions(v, path, options, undefined, disabled, cache));
			if (e === SKIP) return SKIP;
			return e ? not(e) : falseExpr();
		}
		case '$text': {
			if (isDisabled(v, cache)) return SKIP;
			if (path.length) throw new Error(`Unsupported operator $text at ${field(path)}`);
			const textEntries = isPlainObject(v) ? entries(v, cache) : [];
			if (isPlainObject(v)) {
				const unsupported = textEntries.find(([k]) => k !== '$search');
				if (unsupported) throw new Error(`Unsupported $text option ${unsupported[0]}`);
			}
			const search = textEntries.find(([k]) => k === '$search')?.[1];
			if (typeof search !== 'string') throw new Error('$text requires { $search: string }');
			if (!options.onSearch) throw new Error('$text requires the onSearch option');
			const result = options.onSearch(search);
			if (result !== undefined) formatQuery(result);
			return result === undefined ? SKIP : result;
		}
	}
	throw new Error(`Unsupported operator ${op} at ${field(path) || 'root'}`);
}

function field(path: Path): string {
	return path.join('.');
}

function ref(path: Path): RefExpr {
	for (const name of path) {
		if (!isQueryName(name)) throw new Error(`Field can not be written in MiniQuery: ${field(path)}`);
	}
	return { type: 'ref', value: path };
}

function literal(v: unknown, path: Path): LiteralExpr {
	if (v instanceof Date) {
		if (Number.isNaN(v.getTime())) throw new Error(`Invalid date at ${field(path)}`);
		return { type: 'literal', value: v.toISOString() };
	}
	if (typeof v === 'bigint') {
		if (v > BigInt(Number.MAX_SAFE_INTEGER) || v < BigInt(Number.MIN_SAFE_INTEGER)) {
			throw new Error(`Number can not be written in MiniQuery: ${v} at ${field(path)}`);
		}
		return { type: 'literal', value: Number(v) };
	}
	if (typeof v === 'number' && !Number.isFinite(v))
		throw new Error(`Number can not be written in MiniQuery: ${v} at ${field(path)}`);
	if (typeof v === 'string') {
		quoteQueryString(v);
		return { type: 'literal', value: v };
	}
	if (v === null || typeof v === 'number' || typeof v === 'boolean') {
		return { type: 'literal', value: v };
	}
	throw new Error(`Unsupported value at ${field(path)}: ${Object.prototype.toString.call(v)}`);
}

function compare(path: Path, op: CompareExpr['op'], right: Expr): CompareExpr {
	return { type: 'compare', op, left: ref(path), right };
}

/** `IS NULL` / `IS NOT NULL` for null, a comparison otherwise. */
function equals(path: Path, v: unknown, negate: boolean): Expr {
	if (v === null) return compare(path, negate ? 'IS NOT' : 'IS', { type: 'literal', value: null });
	return compare(path, negate ? '!=' : '=', literal(v, path));
}

function regex(path: Path, v: unknown, options?: unknown): Expr {
	let source: string;
	if (v instanceof RegExp) {
		if (v.flags)
			throw new Error(`Regular expression flags are not supported at ${field(path)}: /${v.source}/${v.flags}`);
		source = v.source;
	} else if (typeof v === 'string') {
		source = v;
	} else {
		throw new Error(`$regex requires a string or RegExp at ${field(path)}`);
	}
	if (options !== undefined && options !== '')
		throw new Error(`$options are not supported at ${field(path)}: ${String(options)}`);
	return compare(path, '~', literal(source, path));
}

/** `field IN (...)`, with `null` in the list as `IS NULL`. */
function membership(path: Path, v: unknown, negate: boolean): Expr {
	if (!Array.isArray(v)) throw new Error(`${negate ? '$nin' : '$in'} requires an array at ${field(path)}`);
	assertDenseArray(v, path, negate ? '$nin' : '$in');
	const values = v.filter((x) => x !== null);
	const parts: Expr[] = [];
	if (values.length || !v.length) {
		parts.push(compare(path, negate ? 'NOT IN' : 'IN', { type: 'list', items: values.map((x) => literal(x, path)) }));
	}
	if (values.length !== v.length) parts.push(equals(path, null, negate));
	return logic(negate ? 'AND' : 'OR', parts)!;
}

/**
 * Conditions on one field: a value, an array, a RegExp, or an operator object. `$and` / `$or` / `$nor` here
 * group conditions relative to the field.
 */
function fieldConditions(
	path: Path,
	v: unknown,
	options: DocumentQueryOptions,
	operatorEntries?: Array<[string, unknown]>,
	valueDisabled?: boolean,
	cache: QueryCache = newQueryCache(),
): Condition[] {
	if (valueDisabled ?? isDisabled(v, cache)) return [];
	if (Array.isArray(v)) return [membership(path, v, false)];
	if (v instanceof RegExp) return [regex(path, v)];
	if (!isPlainObject(v)) return [equals(path, v, false)];

	const out: Condition[] = [];
	const currentEntries = operatorEntries ?? entries(v, cache);
	const regexOptions = currentEntries.find(([k]) => k === '$options')?.[1];
	const hasRegex = currentEntries.some(([k]) => k === '$regex');
	for (const [k, value] of currentEntries) {
		if (!k.startsWith('$')) {
			// mixed with operators: a nested field, as in `{ a: { $gt: 1, b: 2 } }`
			if (isDisabled(value, cache)) out.push(SKIP);
			else out.push(...conditions({ [k]: value }, path, options, undefined, undefined, cache));
			continue;
		}
		switch (k) {
			case '$eq':
			case '$ne':
				out.push(isPlainObject(value) || Array.isArray(value) ? invalid(k, path) : equals(path, value, k === '$ne'));
				break;
			case '$gt':
			case '$gte':
			case '$lt':
			case '$lte':
			case '$like':
			case '$nlike':
				if (value === null) throw new Error(`${k} requires a value at ${field(path)}`);
				if ((k === '$like' || k === '$nlike') && typeof value !== 'string')
					throw new Error(`${k} requires a string at ${field(path)}`);
				out.push(compare(path, COMPARE[k], literal(value, path)));
				break;
			case '$in':
			case '$nin':
				out.push(membership(path, value, k === '$nin'));
				break;
			case '$regex':
				out.push(regex(path, value, regexOptions));
				break;
			case '$options':
				if (!hasRegex) throw new Error(`$options requires $regex at ${field(path)}`);
				break;
			case '$exists':
				if (typeof value !== 'boolean') throw new Error(`$exists requires a boolean at ${field(path)}`);
				out.push(equals(path, null, value));
				break;
			case '$size':
				if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
					throw new Error(`$size requires a non-negative integer at ${field(path)}`);
				}
				out.push({
					type: 'compare',
					op: '=',
					left: { type: 'func', name: 'LENGTH', args: [ref(path)] },
					right: literal(value, path),
				});
				break;
			case '$all':
				if (!Array.isArray(value)) throw new Error(`$all requires an array at ${field(path)}`);
				assertDenseArray(value, path, '$all');
				out.push(compare(path, '@>', { type: 'list', items: value.map((x) => literal(x, path)) }));
				break;
			case '$not': {
				const disabled = isDisabled(value, cache);
				if (disabled) {
					out.push(SKIP);
					break;
				}
				const inner = and(fieldConditions(path, value, options, undefined, disabled, cache));
				if (inner === SKIP) {
					out.push(SKIP);
					break;
				}
				out.push(inner ? not(inner) : falseExpr());
				break;
			}
			case '$and':
			case '$or':
			case '$nor': {
				const e = logical(k, value, path, options, cache);
				out.push(e);
				break;
			}
			default:
				throw new Error(`Unsupported operator ${k} at ${field(path)}`);
		}
	}
	return out;
}

function invalid(op: string, path: Path): never {
	throw new Error(`${op} requires a value, not an object or array, at ${field(path)}`);
}

function assertDenseArray(value: unknown[], path: Path, operator: string): void {
	for (let i = 0; i < value.length; i++) {
		if (!(i in value)) throw new Error(`${operator} does not support sparse arrays at ${field(path)}`);
	}
}
