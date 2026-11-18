import { CastFunction, CompareOperator, ExprType, LiteralKind, VarScope, WindowFrameBoundKind } from './const';
import { formatQuery } from './formatQuery';
import { names, path, quoteIdent, quoteString, quoteWindowIdent } from './quote';
import type {
	Expr,
	FuncExpr,
	LimitClause,
	LiteralExpr,
	OrderByItem,
	VarExpr,
	WindowFrame,
	WindowFrameBound,
	WindowSpec,
} from './types';

/** Expressions that change meaning when embedded into another operator without parentheses. */
const NEEDS_PAREN: ReadonlySet<Expr['type']> = new Set([
	ExprType.Compare,
	ExprType.Between,
	ExprType.In,
	ExprType.Collate,
	ExprType.Lambda,
]);

export function operand(e: Expr): string {
	const s = formatExpr(e);
	return NEEDS_PAREN.has(e.type) ? `(${s})` : s;
}

export function formatExpr(e: Expr): string {
	switch (e.type) {
		case ExprType.Logic:
			return `(${e.exprs.map(formatExpr).join(` ${e.op} `)})`;
		case ExprType.Binary:
			return `(${operand(e.left)} ${e.op} ${operand(e.right)})`;
		case ExprType.Unary:
			return `(${e.op}${/^[A-Z]/.test(e.op) ? ' ' : ''}${operand(e.expr)})`;
		case ExprType.Compare: {
			const { op, left, right } = e;
			const l = operand(left);
			if (op === CompareOperator.MemberOf) return `${l} ${op} (${formatExpr(right)})`;
			let s = `${l} ${op} ${e.quantifier ? `${e.quantifier} ` : ''}${operand(right)}`;
			if (e.escape) s += ` ESCAPE ${operand(e.escape)}`;
			return s;
		}
		case ExprType.Between:
			return `${operand(e.expr)} ${e.not ? 'NOT ' : ''}BETWEEN ${operand(e.low)} AND ${operand(e.high)}`;
		case ExprType.In: {
			const right = e.query ? formatQuery(e.query) : (e.list || []).map(formatExpr).join(', ');
			return `${operand(e.expr)} ${e.not ? 'NOT ' : ''}IN (${right})`;
		}
		case ExprType.Exists:
			return `EXISTS (${formatQuery(e.query)})`;
		case ExprType.Case: {
			const s = ['CASE'];
			if (e.condition) s.push(formatExpr(e.condition));
			for (const c of e.cases) s.push(`WHEN ${formatExpr(c.when)} THEN ${formatExpr(c.then)}`);
			if (e.else) s.push(`ELSE ${formatExpr(e.else)}`);
			s.push('END');
			return s.join(' ');
		}
		case ExprType.Literal:
			return formatLiteral(e);
		case ExprType.Column:
			return path([e.catalog, e.db, e.table, e.name]);
		case ExprType.Star: {
			const q = path([e.catalog, e.db, e.table]);
			return q ? `${q}.*` : '*';
		}
		case ExprType.Row:
			return `(${e.items.map(formatExpr).join(', ')})`;
		case ExprType.Array:
			return `[${e.items.map(formatExpr).join(', ')}]`;
		case ExprType.GroupingSets:
			return `GROUPING SETS (${e.sets.map((v) => `(${v.map(formatExpr).join(', ')})`).join(', ')})`;
		case ExprType.Func:
			return formatFunc(e);
		case ExprType.Cast:
			if (e.charset) return `CONVERT(${formatExpr(e.expr)} USING ${quoteIdent(e.charset)})`;
			if (e.fn === CastFunction.Convert) return `CONVERT(${formatExpr(e.expr)}, ${e.dataType})`;
			return `CAST(${formatExpr(e.expr)} AS ${e.dataType})`;
		case ExprType.Collate:
			return `${operand(e.expr)} COLLATE ${quoteIdent(e.collation)}`;
		case ExprType.Subscript:
			return `${operand(e.expr)}[${formatExpr(e.index)}]`;
		case ExprType.Interval:
			return `INTERVAL ${operand(e.expr)} ${e.unit}`;
		case ExprType.Keyword:
			return e.value;
		case ExprType.Lambda: {
			const p = e.params.length === 1 ? quoteIdent(e.params[0]) : `(${names(e.params)})`;
			return `${p} -> ${formatExpr(e.body)}`;
		}
		case ExprType.Match:
			return `MATCH (${e.columns.map(formatExpr).join(', ')}) AGAINST (${formatExpr(e.against)}${e.mode ? ` ${e.mode}` : ''})`;
		case ExprType.Param:
			return '?';
		case ExprType.Subquery:
			return `(${formatQuery(e.query)})`;
		case ExprType.Var:
			return formatVar(e);
		default:
			throw new Error(`Unknown expr type: ${(e as { type: string }).type}`);
	}
}

function formatLiteral(e: LiteralExpr): string {
	const { value, kind, charset } = e;
	switch (kind) {
		case LiteralKind.Hex:
			// X'..' needs an even number of digits, 0x.. does not (but can not be empty)
			return String(value).length % 2 ? `0x${value}` : `X'${value}'`;
		case LiteralKind.Bit:
			return `b'${value}'`;
		case LiteralKind.Number:
			return String(value);
		case LiteralKind.Date:
		case LiteralKind.Time:
		case LiteralKind.Timestamp:
			return `${kind.toUpperCase()} ${quoteString(String(value))}`;
	}
	if (value === null || typeof value === 'boolean') return String(value).toUpperCase();
	// String(-0) is '0'; keep the sign so a folded `-0` re-parses to the same literal
	if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
	return `${charset ? `_${charset}` : ''}${quoteString(value)}`;
}

export function formatVar(v: VarExpr): string {
	const name = /^[A-Za-z0-9_$.]+$/.test(v.name) ? v.name : quoteIdent(v.name);
	switch (v.scope) {
		case VarScope.User:
			return `@${name}`;
		case VarScope.System:
			return `@@${name}`;
		default:
			return `@@${v.scope}.${name}`;
	}
}

export function formatFunc(e: FuncExpr): string {
	// Built-in names are kept as written: quoting them would turn the call into a stored function lookup.
	// A quoted name stays quoted for the same reason.
	const bare = !e.quoted && /^[A-Za-z_][A-Za-z0-9_$]*$/.test(e.name);
	const name = (e.db ? `${quoteIdent(e.db)}.` : '') + (bare ? e.name : `\`${e.name.replaceAll('`', '``')}\``);
	// special argument syntax only belongs to the built-ins, not to stored functions of the same name
	const upper = e.db || e.quoted || e.spaced ? '' : e.name.toUpperCase();
	let inner: string;
	if (upper === 'EXTRACT' && e.args.length === 2 && e.args[0].type === ExprType.Keyword) {
		inner = `${e.args[0].value} FROM ${formatExpr(e.args[1])}`;
	} else if (upper === 'TRIM' && e.trim) {
		const [s, rem] = e.args;
		inner = `${e.trim} ${rem ? `${formatExpr(rem)} ` : ''}FROM ${formatExpr(s)}`;
	} else if (upper === 'POSITION' && e.args.length === 2) {
		inner = `${operand(e.args[0])} IN ${formatExpr(e.args[1])}`;
	} else {
		inner = e.args.map(formatExpr).join(', ');
		if (e.distinct) inner = `DISTINCT ${inner}`;
		if (e.orderBy) inner += ` ${formatOrderBy(e.orderBy)}`;
		if (e.separator) inner += ` SEPARATOR ${formatExpr(e.separator)}`;
	}
	let s = `${name}${e.spaced ? ' ' : ''}(${inner})`;
	if (e.over) {
		s += typeof e.over === 'string' ? ` OVER ${quoteWindowIdent(e.over)}` : ` OVER (${formatWindowSpec(e.over)})`;
	}
	return s;
}

export function formatWindowSpec(w: WindowSpec): string {
	const s: string[] = [];
	if (w.name) s.push(quoteWindowIdent(w.name));
	if (w.partitionBy) s.push(`PARTITION BY ${w.partitionBy.map(formatExpr).join(', ')}`);
	if (w.orderBy) s.push(formatOrderBy(w.orderBy));
	if (w.frame) s.push(formatWindowFrame(w.frame));
	return s.join(' ');
}

function formatFrameBound(bound: WindowFrameBound): string {
	switch (bound.kind) {
		case WindowFrameBoundKind.Current:
			return 'CURRENT ROW';
		case WindowFrameBoundKind.Unbounded:
			return `UNBOUNDED ${bound.direction}`;
		case WindowFrameBoundKind.Offset:
			return `${formatExpr(bound.value)} ${bound.direction}`;
	}
}

function formatWindowFrame(frame: WindowFrame): string {
	const bounds = frame.end
		? `BETWEEN ${formatFrameBound(frame.start)} AND ${formatFrameBound(frame.end)}`
		: formatFrameBound(frame.start);
	return `${frame.unit} ${bounds}`;
}

export function formatOrderBy(items: OrderByItem[]): string {
	return `ORDER BY ${items
		.map((v) => [formatExpr(v.expr), v.order, v.nulls && `NULLS ${v.nulls}`].filter(Boolean).join(' '))
		.join(', ')}`;
}

export function formatLimit(l: LimitClause): string {
	// Preserve placeholder binding order when the source used LIMIT offset, count.
	if (l.count.type === ExprType.Param && l.offset?.type === ExprType.Param && l.offset.index < l.count.index) {
		return `LIMIT ${formatExpr(l.offset)}, ${formatExpr(l.count)}`;
	}
	return `LIMIT ${formatExpr(l.count)}${l.offset ? ` OFFSET ${formatExpr(l.offset)}` : ''}`;
}
