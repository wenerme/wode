import { IntoKind, NodeType, SchemaObject, StatementType, TableExprType } from './ast/const';
import { parseMysql, type ParseMysqlOptions } from './ast/parseMysql';
import type { MysqlScript, Node, QualifiedName, QueryStatement, Statement, TableExpr, TableName } from './ast/types';

export const MysqlTableAccessMode = {
	Read: 'read',
	Write: 'write',
} as const;
export type MysqlTableAccessMode = (typeof MysqlTableAccessMode)[keyof typeof MysqlTableAccessMode];

export type MysqlTableAccess = QualifiedName & {
	access: MysqlTableAccessMode;
};

export const MysqlRisk = {
	/** UPDATE/DELETE without WHERE */
	NoWhere: 'no-where',
	/** SELECT ... INTO OUTFILE/DUMPFILE */
	IntoFile: 'into-file',
	Drop: 'drop',
	Truncate: 'truncate',
	/** functions like SLEEP/BENCHMARK/LOAD_FILE */
	DangerousFunction: 'dangerous-function',
	/** statement not modeled by the parser */
	UnknownStatement: 'unknown-statement',
	/** schema change represented by a generic DDL node */
	Ddl: 'ddl',
	/** LOAD DATA writes an external file into a table */
	LoadData: 'load-data',
	/** RENAME changes the identity of two table objects */
	Rename: 'rename',
	/** LOCK TABLES changes connection level locking state */
	LockTables: 'lock-tables',
} as const;
export type MysqlRisk = (typeof MysqlRisk)[keyof typeof MysqlRisk];

export type MysqlStatementAnalysis = {
	type: Statement['type'];
	/** for `Unknown`, the leading keyword */
	keyword?: string;
	tables: MysqlTableAccess[];
	/** upper cased, stored functions are `db.NAME` */
	functions: string[];
	risks: MysqlRisk[];
	statement: Statement;
};

const DANGEROUS_FUNCTIONS = new Set([
	'SLEEP',
	'BENCHMARK',
	'LOAD_FILE',
	'GET_LOCK',
	'RELEASE_ALL_LOCKS',
	'SYS_EXEC',
	'SYS_EVAL',
]);

/**
 * Analyze statements for auditing: tables read/written, called functions and risky patterns.
 *
 * `Unknown` statements (SHOW/GRANT and other unsupported non-modeled statements) carry no table info,
 * table based authorization should reject them.
 * Function checks only see names, user defined/stored functions can not be classified.
 */
export function analyzeMysql(
	input: string | Statement | Statement[] | MysqlScript,
	options?: ParseMysqlOptions,
): MysqlStatementAnalysis[] {
	const statements =
		typeof input === 'string'
			? parseMysql(input, options)
			: Array.isArray(input)
				? input
				: input.type === NodeType.Script
					? input.statements
					: [input];
	return statements.map(analyzeStatement);
}

function analyzeStatement(statement: Statement): MysqlStatementAnalysis {
	const tables = new Map<string, MysqlTableAccess>();
	const functions = new Set<string>();
	const risks = new Set<MysqlRisk>();
	const writes = new Set<TableName>();
	// delete targets reference tables in `from` by name/alias, they are resolved above
	const skip = new Set<TableName>(statement.type === StatementType.Delete ? statement.targets : []);

	const add = ({ catalog, db, name }: QualifiedName, access: MysqlTableAccess['access']) => {
		const key = keyOf({ catalog, db, name });
		const found = tables.get(key);
		if (found) {
			if (access === MysqlTableAccessMode.Write) found.access = MysqlTableAccessMode.Write;
			return;
		}
		tables.set(key, { ...(catalog ? { catalog } : {}), ...(db ? { db } : {}), name, access });
	};

	// resolve write targets first so the generic walk below marks other tables as read
	switch (statement.type) {
		case StatementType.Insert:
			writes.add(statement.table);
			break;
		case StatementType.Update: {
			const refs = collectTables(statement.tables);
			if (refs.length === 1) {
				writes.add(refs[0]);
			} else {
				const qualifiers = new Set(statement.set.map((v) => v.column.table?.toLowerCase()));
				for (const t of refs) {
					// unqualified columns can not be resolved without schema, treat every table as written
					if (qualifiers.has(undefined) || qualifiers.has((t.alias || t.name).toLowerCase())) writes.add(t);
				}
			}
			if (!statement.where) risks.add(MysqlRisk.NoWhere);
			break;
		}
		case StatementType.Delete: {
			const refs = collectTables(statement.from);
			if (statement.targets) {
				for (const target of statement.targets) {
					const n = keyOf(target);
					const found = refs.find((t) => (!target.db && t.alias?.toLowerCase() === n) || keyOf(t) === n);
					if (found) writes.add(found);
					else add(target, MysqlTableAccessMode.Write);
				}
			} else {
				writes.add(refs[0]);
			}
			if (!statement.where) risks.add(MysqlRisk.NoWhere);
			break;
		}
		case StatementType.Drop:
			risks.add(MysqlRisk.Drop);
			if (statement.object !== SchemaObject.Database)
				for (const n of statement.names) add(n, MysqlTableAccessMode.Write);
			break;
		case StatementType.Truncate:
			risks.add(MysqlRisk.Truncate);
			writes.add(statement.table);
			break;
		case StatementType.Create:
			if (statement.object !== SchemaObject.Database) add(statement.name, MysqlTableAccessMode.Write);
			if (statement.like) add(statement.like, MysqlTableAccessMode.Read);
			for (const reference of statement.references || []) add(reference, MysqlTableAccessMode.Read);
			risks.add(MysqlRisk.Ddl);
			break;
		case StatementType.CreateIndex:
			add(statement.table, MysqlTableAccessMode.Write);
			risks.add(MysqlRisk.Ddl);
			break;
		case StatementType.AlterTable:
			add(statement.table, MysqlTableAccessMode.Write);
			if (statement.renameTo) add(statement.renameTo, MysqlTableAccessMode.Write);
			if (statement.exchangeTable) add(statement.exchangeTable, MysqlTableAccessMode.Write);
			for (const reference of statement.references || []) add(reference, MysqlTableAccessMode.Read);
			for (const action of statement.actions || []) {
				if (action.renameTo) add(action.renameTo, MysqlTableAccessMode.Write);
				if (action.exchangeTable) add(action.exchangeTable, MysqlTableAccessMode.Write);
				for (const reference of action.references || []) add(reference, MysqlTableAccessMode.Read);
			}
			risks.add(MysqlRisk.Ddl);
			break;
		case StatementType.LoadData:
			add(statement.table, MysqlTableAccessMode.Write);
			risks.add(MysqlRisk.LoadData);
			break;
		case StatementType.Rename:
			for (const rename of statement.renames) {
				add(rename.from, MysqlTableAccessMode.Write);
				add(rename.to, MysqlTableAccessMode.Write);
			}
			risks.add(MysqlRisk.Rename);
			break;
		case StatementType.LockTables:
			for (const lock of statement.locks)
				add(lock.table, lock.mode.includes('WRITE') ? MysqlTableAccessMode.Write : MysqlTableAccessMode.Read);
			risks.add(MysqlRisk.LockTables);
			break;
		case StatementType.Unknown:
			risks.add(MysqlRisk.UnknownStatement);
			break;
	}

	const walk = (node: unknown, scope: ReadonlySet<string>): void => {
		if (!node || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			for (const v of node) walk(v, scope);
			return;
		}
		const n = node as Node;
		switch (n.type) {
			case StatementType.Select:
			case StatementType.SetOp:
			case StatementType.QueryGroup:
			case StatementType.Insert:
			case StatementType.Update:
			case StatementType.Delete: {
				if ('into' in n && n.into && n.into.kind !== IntoKind.Var) risks.add(MysqlRisk.IntoFile);
				const w = (n as QueryStatement).with;
				if (w) {
					// CTE names only shadow tables inside this statement subtree
					const inner = new Set(scope);
					const names = w.ctes.map((c) => c.name.toLowerCase());
					if (w.recursive) names.forEach((v) => inner.add(v));
					for (const [i, c] of w.ctes.entries()) {
						walk(c.query, inner);
						inner.add(names[i]);
					}
					const { with: _, ...rest } = n as QueryStatement;
					walkChildren(rest, inner);
					return;
				}
				break;
			}
			case TableExprType.Table: {
				if (skip.has(n)) return;
				const name = n.name.toLowerCase();
				// the DUAL keyword is no table; a quoted `dual` is a real one
				if (n.dual) return;
				if (!n.db && !n.catalog && !writes.has(n) && scope.has(name)) return;
				add(n, writes.has(n) ? MysqlTableAccessMode.Write : MysqlTableAccessMode.Read);
				return;
			}
			case NodeType.Func: {
				const name = n.name.toUpperCase();
				functions.add(n.db ? `${n.db}.${name}` : name);
				if (!n.db && DANGEROUS_FUNCTIONS.has(name)) risks.add(MysqlRisk.DangerousFunction);
				break;
			}
		}
		walkChildren(n, scope);
	};
	const walkChildren = (node: object, scope: ReadonlySet<string>) => {
		for (const v of Object.values(node)) {
			if (v && typeof v === 'object') walk(v, scope);
		}
	};
	walk(statement, new Set());

	return {
		type: statement.type,
		...(statement.type === StatementType.Unknown ? { keyword: statement.keyword } : {}),
		tables: [...tables.values()],
		functions: [...functions],
		risks: [...risks],
		statement,
	};
}

function keyOf({ catalog, db, name }: QualifiedName) {
	return [catalog, db, name].filter(Boolean).join('.').toLowerCase();
}

function collectTables(refs: TableExpr[]): TableName[] {
	const out: TableName[] = [];
	const walk = (t: TableExpr) => {
		switch (t.type) {
			case TableExprType.Table:
				out.push(t);
				break;
			case TableExprType.Join:
				walk(t.left);
				walk(t.right);
				break;
		}
	};
	refs.forEach(walk);
	return out;
}
