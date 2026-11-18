import { IntoKind, OutfileOptionsKind, QueryType, SetOperator } from './const';
import { formatExpr, formatFunc, formatLimit, formatOrderBy, formatVar, formatWindowSpec } from './formatExpr';
import { formatTables } from './formatTable';
import { names, qualified, quoteIdent, quoteString, quoteWindowIdent } from './quote';
import type {
	IntoClause,
	LockingClause,
	OutfileOptions,
	QueryGroup,
	QueryStatement,
	SelectStatement,
	SetOpStatement,
	WithClause,
} from './types';

export function formatQuery(q: QueryStatement): string {
	switch (q.type) {
		case QueryType.Select:
			return formatSelect(q);
		case QueryType.QueryGroup:
			return formatQueryGroup(q);
		case QueryType.SetOp:
			return formatSetOp(q);
	}
}

export function formatWith(w?: WithClause): string {
	if (!w) return '';
	const ctes = w.ctes.map(
		(c) => `${quoteIdent(c.name)}${c.columns ? ` (${names(c.columns)})` : ''} AS (${formatQuery(c.query)})`,
	);
	return `WITH ${w.recursive ? 'RECURSIVE ' : ''}${ctes.join(', ')} `;
}

function formatSelect(s: SelectStatement): string {
	const p: string[] = [`${formatWith(s.with)}SELECT`];
	if (s.distinct) p.push('DISTINCT');
	if (s.options) p.push(...s.options);
	p.push(s.columns.map((c) => `${formatExpr(c.expr)}${c.alias ? ` AS ${quoteIdent(c.alias)}` : ''}`).join(', '));
	if (s.from) p.push(`FROM ${formatTables(s.from)}`);
	for (const v of s.lateralViews || []) {
		p.push(
			`LATERAL VIEW ${v.outer ? 'OUTER ' : ''}${formatFunc(v.func)} ${quoteIdent(v.alias)}${v.columns ? ` AS ${names(v.columns)}` : ''}`,
		);
	}
	if (s.where) p.push(`WHERE ${formatExpr(s.where)}`);
	if (s.groupBy) {
		p.push(`GROUP BY ${s.groupBy.items.map(formatExpr).join(', ')}${s.groupBy.rollup ? ' WITH ROLLUP' : ''}`);
	}
	if (s.having) p.push(`HAVING ${formatExpr(s.having)}`);
	if (s.windows) {
		p.push(`WINDOW ${s.windows.map((w) => `${quoteWindowIdent(w.name)} AS (${formatWindowSpec(w.spec)})`).join(', ')}`);
	}
	if (s.qualify) p.push(`QUALIFY ${formatExpr(s.qualify)}`);
	if (s.orderBy) p.push(formatOrderBy(s.orderBy));
	if (s.limit) p.push(formatLimit(s.limit));
	if (s.locking) p.push(...s.locking.map(formatLocking));
	if (s.into) p.push(formatInto(s.into));
	return p.join(' ');
}

function formatQueryGroup(s: QueryGroup): string {
	const p = [`${formatWith(s.with)}(${formatQuery(s.query)})`];
	if (s.orderBy) p.push(formatOrderBy(s.orderBy));
	if (s.limit) p.push(formatLimit(s.limit));
	if (s.into) p.push(formatInto(s.into));
	return p.join(' ');
}

function formatSetOp(s: SetOpStatement): string {
	const l = formatQuery(s.left);
	const r = formatQuery(s.right);
	const p = [
		formatWith(s.with) + (needParen(s.left, s, false) ? `(${l})` : l),
		s.op + (s.all ? ' ALL' : s.distinct ? ' DISTINCT' : ''),
		needParen(s.right, s, true) ? `(${r})` : r,
	];
	if (s.orderBy) p.push(formatOrderBy(s.orderBy));
	if (s.limit) p.push(formatLimit(s.limit));
	if (s.into) p.push(formatInto(s.into));
	return p.join(' ');
}

/** INTERSECT binds tighter than UNION / EXCEPT / MINUS. */
function precedence(op: SetOperator): number {
	return op === SetOperator.Intersect ? 2 : 1;
}

function needParen(q: QueryStatement, parent: SetOpStatement, right: boolean): boolean {
	if (q.with || q.orderBy || q.limit || q.into) return true;
	switch (q.type) {
		case QueryType.QueryGroup:
			return false;
		case QueryType.Select:
			return Boolean(q.locking?.length);
		case QueryType.SetOp:
			// operators of the same level are left associative
			return precedence(q.op) < precedence(parent.op) || (right && precedence(q.op) === precedence(parent.op));
	}
}

function formatLocking(lock: LockingClause): string {
	if (lock.legacy) return 'LOCK IN SHARE MODE';
	const tables = lock.tables?.map((t) => `${qualified(t)}${t.star ? '.*' : ''}`).join(', ');
	return `FOR ${lock.mode}${tables ? ` OF ${tables}` : ''}${lock.wait ? ` ${lock.wait}` : ''}`;
}

export function formatInto(into: IntoClause): string {
	if (into.kind === IntoKind.Var) return `INTO ${into.vars.map(formatVar).join(', ')}`;
	return `INTO ${into.kind} ${quoteString(into.file)}${into.options ? ` ${formatOutfileOptions(into.options)}` : ''}`;
}

function formatOutfileOptions(options: OutfileOptions): string {
	if (options.kind === OutfileOptionsKind.Doris) {
		const properties = options.properties?.map((p) => `${quoteString(p.name)} = ${quoteString(p.value)}`).join(', ');
		return `FORMAT AS ${options.format}${properties ? ` PROPERTIES (${properties})` : ''}`;
	}
	const parts: string[] = [];
	if (options.charset) parts.push(`CHARACTER SET ${quoteIdent(options.charset)}`);
	if (options.fields) {
		const { terminatedBy, enclosedBy, optionally, escapedBy } = options.fields;
		parts.push('FIELDS');
		if (terminatedBy !== undefined) parts.push(`TERMINATED BY ${quoteString(terminatedBy)}`);
		if (enclosedBy !== undefined) {
			parts.push(`${optionally ? 'OPTIONALLY ' : ''}ENCLOSED BY ${quoteString(enclosedBy)}`);
		}
		if (escapedBy !== undefined) parts.push(`ESCAPED BY ${quoteString(escapedBy)}`);
	}
	if (options.lines) {
		const { startingBy, terminatedBy } = options.lines;
		parts.push('LINES');
		if (startingBy !== undefined) parts.push(`STARTING BY ${quoteString(startingBy)}`);
		if (terminatedBy !== undefined) parts.push(`TERMINATED BY ${quoteString(terminatedBy)}`);
	}
	return parts.join(' ');
}
