import { JsonTableColumnKind, JsonTableResponseAction, TableExprType } from './const';
import { formatExpr, formatFunc } from './formatExpr';
import { formatQuery } from './formatQuery';
import { names, qualified, quoteIdent, quoteString } from './quote';
import type { IndexHint, JsonTable, JsonTableColumn, JsonTableResponse, TableExpr, TableName } from './types';

function formatIndexHint(hint: IndexHint): string {
	return `${hint.kind} INDEX${hint.scope ? ` FOR ${hint.scope}` : ''} (${names(hint.indexes)})`;
}

export function formatTableName(t: TableName): string {
	// the keyword is never quoted; a table named dual is (`dual` is reserved)
	const s = [t.dual ? t.name : qualified(t)];
	if (t.partition) s.push(`${t.temporaryPartition ? 'TEMPORARY ' : ''}PARTITION (${names(t.partition)})`);
	if (t.tablet) s.push(`TABLET (${t.tablet.join(', ')})`);
	if (t.alias) s.push(`AS ${quoteIdent(t.alias)}`);
	if (t.indexHints) s.push(...t.indexHints.map(formatIndexHint));
	return s.join(' ');
}

export function formatTable(t: TableExpr): string {
	switch (t.type) {
		case TableExprType.Table:
			return formatTableName(t);
		case TableExprType.Derived: {
			let s = `${t.lateral ? 'LATERAL ' : ''}(${formatQuery(t.query)})`;
			if (t.alias) s += ` AS ${quoteIdent(t.alias)}`;
			if (t.columns) s += ` (${names(t.columns)})`;
			return s;
		}
		case TableExprType.TableFunc:
			return `${formatFunc(t.func)}${t.alias ? ` AS ${quoteIdent(t.alias)}` : ''}`;
		case TableExprType.JsonTable:
			return formatJsonTable(t);
		case TableExprType.Join: {
			const right = t.right.type === TableExprType.Join ? `(${formatTable(t.right)})` : formatTable(t.right);
			let s = `${formatTable(t.left)} ${t.natural ? 'NATURAL ' : ''}${t.join}${t.hint ? ` [${t.hint}]` : ''} ${right}`;
			if (t.on) s += ` ON ${formatExpr(t.on)}`;
			if (t.using) s += ` USING (${names(t.using)})`;
			return s;
		}
	}
}

export function formatTables(t: TableExpr[]): string {
	return t.map(formatTable).join(', ');
}

function formatJsonTable(t: JsonTable): string {
	const columns = t.columns.map(formatJsonTableColumn).join(', ');
	return `JSON_TABLE(${formatExpr(t.expr)}, ${quoteString(t.path)} COLUMNS (${columns})) AS ${quoteIdent(t.alias)}`;
}

function formatJsonTableColumn(column: JsonTableColumn): string {
	switch (column.kind) {
		case JsonTableColumnKind.Ordinality:
			return `${quoteIdent(column.name)} FOR ORDINALITY`;
		case JsonTableColumnKind.Nested:
			return `NESTED PATH ${quoteString(column.path)} COLUMNS (${column.columns.map(formatJsonTableColumn).join(', ')})`;
		case JsonTableColumnKind.Path: {
			let sql = `${quoteIdent(column.name)} ${column.dataType}${column.exists ? ' EXISTS' : ''} PATH ${quoteString(column.path)}`;
			if (column.onEmpty) sql += ` ${formatJsonTableResponse(column.onEmpty)} ON EMPTY`;
			if (column.onError) sql += ` ${formatJsonTableResponse(column.onError)} ON ERROR`;
			return sql;
		}
	}
}

function formatJsonTableResponse(response: JsonTableResponse): string {
	return response.action === JsonTableResponseAction.Default
		? `${response.action} ${quoteString(response.value)}`
		: response.action;
}
