import { IndexKind, SchemaObject, StatementType, VarScope } from './const';
import { formatExpr, formatLimit, formatOrderBy, formatVar } from './formatExpr';
import { formatQuery, formatWith } from './formatQuery';
import { formatTableName, formatTables } from './formatTable';
import { names, path, qualified, quoteIdent, quoteString } from './quote';
import type {
	AlterTableStatement,
	Assignment,
	CreateIndexStatement,
	CreateStatement,
	DeleteStatement,
	InsertStatement,
	LoadDataStatement,
	SetStatement,
	Statement,
	UpdateStatement,
} from './types';

export function formatStatement(s: Statement): string {
	switch (s.type) {
		case StatementType.Select:
		case StatementType.QueryGroup:
		case StatementType.SetOp:
			return formatQuery(s);
		case StatementType.Insert:
			return formatInsert(s);
		case StatementType.Update:
			return formatUpdate(s);
		case StatementType.Delete:
			return formatDelete(s);
		case StatementType.Use:
			return `USE ${path([s.catalog, s.db])}`;
		case StatementType.Set:
			return formatSet(s);
		case StatementType.Explain:
			return ['EXPLAIN', ...(s.options || []), formatStatement(s.statement)].join(' ');
		case StatementType.Describe:
			return `DESCRIBE ${qualified(s.table)}`;
		case StatementType.Drop:
			return join([
				'DROP',
				s.temporary && 'TEMPORARY',
				s.object,
				s.ifExists && 'IF EXISTS',
				s.names.map(qualified).join(', '),
				s.force && 'FORCE',
			]);
		case StatementType.Truncate:
			return `TRUNCATE TABLE ${formatTableName(s.table)}`;
		case StatementType.Create:
			return formatCreate(s);
		case StatementType.CreateIndex:
			return formatCreateIndex(s);
		case StatementType.AlterTable:
			return formatAlterTable(s);
		case StatementType.LoadData:
			return formatLoadData(s);
		case StatementType.Rename:
			return `RENAME TABLE ${s.renames.map((v) => `${qualified(v.from)} TO ${qualified(v.to)}`).join(', ')}`;
		case StatementType.LockTables:
			return `LOCK TABLES ${s.locks.map((v) => `${formatTableName(v.table)} ${v.mode}`).join(', ')}`;
		case StatementType.Unknown:
			return s.text;
		default:
			throw new Error(`Unknown statement type: ${(s as { type: string }).type}`);
	}
}

function join(parts: Array<string | false | undefined>): string {
	return parts.filter(Boolean).join(' ');
}

function formatAssignments(v: Assignment[]): string {
	return v.map((a) => `${formatExpr(a.column)} = ${formatExpr(a.value)}`).join(', ');
}

function formatInsert(s: InsertStatement): string {
	const p = [formatWith(s.with) + (s.replace ? 'REPLACE' : 'INSERT')];
	if (s.priority) p.push(s.priority);
	if (s.ignore) p.push('IGNORE');
	p.push(s.overwrite ? 'OVERWRITE TABLE' : 'INTO');
	p.push(formatTableName(s.table));
	if (s.label) p.push(`WITH LABEL ${quoteIdent(s.label)}`);
	if (s.columns) p.push(`(${names(s.columns)})`);
	if (s.values) {
		p.push(`VALUES ${s.values.map((row) => `(${row.map(formatExpr).join(', ')})`).join(', ')}`);
		if (s.valuesAlias) p.push(`AS ${quoteIdent(s.valuesAlias)}`);
	} else if (s.set) {
		p.push(`SET ${formatAssignments(s.set)}`);
	} else if (s.query) {
		p.push(formatQuery(s.query));
	}
	if (s.onDuplicateUpdate) p.push(`ON DUPLICATE KEY UPDATE ${formatAssignments(s.onDuplicateUpdate)}`);
	return p.join(' ');
}

function formatUpdate(s: UpdateStatement): string {
	const p = [`${formatWith(s.with)}UPDATE`];
	if (s.priority) p.push(s.priority);
	if (s.ignore) p.push('IGNORE');
	p.push(formatTables(s.tables), `SET ${formatAssignments(s.set)}`);
	if (s.from) p.push(`FROM ${formatTables(s.from)}`);
	if (s.where) p.push(`WHERE ${formatExpr(s.where)}`);
	if (s.orderBy) p.push(formatOrderBy(s.orderBy));
	if (s.limit) p.push(formatLimit(s.limit));
	return p.join(' ');
}

function formatDelete(s: DeleteStatement): string {
	const p = [`${formatWith(s.with)}DELETE`];
	if (s.options) p.push(...s.options);
	const targets = s.targets?.map(qualified).join(', ');
	if (targets) {
		p.push(`${targets} FROM ${formatTables(s.from)}`);
	} else {
		p.push(`FROM ${formatTables(s.from)}`);
		if (s.using) p.push(`USING ${formatTables(s.using)}`);
	}
	if (s.where) p.push(`WHERE ${formatExpr(s.where)}`);
	if (s.orderBy) p.push(formatOrderBy(s.orderBy));
	if (s.limit) p.push(formatLimit(s.limit));
	return p.join(' ');
}

function formatSet(s: SetStatement): string {
	const assignments = s.assignments.map(({ target, value }) => {
		const t =
			target.scope === VarScope.User || target.scope === VarScope.System
				? formatVar(target)
				: `${target.scope.toUpperCase()} ${quoteIdent(target.name)}`;
		return `${t} = ${formatExpr(value)}`;
	});
	return `SET ${assignments.join(', ')}`;
}

function formatCreate(s: CreateStatement): string {
	const view = s.object === SchemaObject.View;
	const head = join([
		'CREATE',
		s.replace && 'OR REPLACE',
		s.temporary && 'TEMPORARY',
		view && s.options,
		s.object,
		s.ifNotExists && 'IF NOT EXISTS',
		qualified(s.name),
	]);
	const tail = join([
		s.definition,
		!view && s.options,
		s.like && `LIKE ${qualified(s.like)}`,
		s.queryModifier,
		s.query && `AS ${formatQuery(s.query)}`,
		s.withCheckOption,
	]);
	return tail ? `${head} ${tail}` : head;
}

function formatCreateIndex(s: CreateIndexStatement): string {
	const kind =
		s.kind === IndexKind.Fulltext || s.kind === IndexKind.Spatial ? `${s.kind} INDEX` : s.kind || IndexKind.Index;
	return join([
		'CREATE',
		s.unique && 'UNIQUE',
		kind,
		quoteIdent(s.index),
		s.prefix,
		'ON',
		formatTableName(s.table),
		s.definition,
		s.options,
	]);
}

function formatAlterTable(s: AlterTableStatement): string {
	const action = (s.actions || []).map((v) => v.action).join(', ') || s.action;
	return `ALTER${s.modifier ? ` ${s.modifier}` : ''} TABLE ${formatTableName(s.table)} ${action}`;
}

function formatLoadData(s: LoadDataStatement): string {
	return join([
		'LOAD DATA',
		s.priority,
		s.local && 'LOCAL',
		`INFILE ${quoteString(s.file)}`,
		s.replace && 'REPLACE',
		s.ignore && 'IGNORE',
		'INTO TABLE',
		formatTableName(s.table),
		s.partition && `PARTITION (${names(s.partition)})`,
		s.options,
		s.set && `SET ${formatAssignments(s.set)}`,
	]);
}
