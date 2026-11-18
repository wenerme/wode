/**
 * MySQL (and variants like Apache Doris) AST.
 *
 * Follows the MiniQuery AST design pattern (plain objects discriminated by `type`, generic operator nodes,
 * optional fields omitted) but is an independent model tailored for auditing and validation.
 * Node `type` discriminants use PascalCase, e.g. `Select`, `AlterTable`, and `Column`.
 */

import type {
	AlterTableModifier,
	BinaryOperator,
	CastFunction,
	CommentKind,
	CompareOperator,
	CompareQuantifier,
	CreateQueryModifier,
	ExprType,
	IndexHintKind,
	IndexHintScope,
	IndexKind,
	InsertPriority,
	IntoKind,
	JoinType,
	JsonTableColumnKind,
	JsonTableResponseAction,
	LiteralKind,
	LoadDataPriority,
	LockMode,
	LockWait,
	LogicOperator,
	NodeType,
	NullsOrder,
	OutfileOptionsKind,
	QueryType,
	SchemaObject,
	SetOperator,
	SortOrder,
	StatementType,
	TableExprType,
	TrimDirection,
	UnaryOperator,
	VarScope,
	WindowFrameBoundKind,
	WindowFrameDirection,
	WindowFrameUnit,
} from './const';

// ---------------------------------------------------------------------------
// Expressions
// ---------------------------------------------------------------------------

export type Expr =
	| BinaryExpr
	| CaseExpr
	| CompareExpr
	| FuncExpr
	| RowExpr
	| LiteralExpr
	| LogicExpr
	| ColumnExpr
	| StarExpr
	| UnaryExpr
	// mysql extensions
	| BetweenExpr
	| ExistsExpr
	| InExpr
	| CastExpr
	| CollateExpr
	| ArrayExpr
	| GroupingSetsExpr
	| SubscriptExpr
	| IntervalExpr
	| KeywordExpr
	| LambdaExpr
	| MatchExpr
	| ParamExpr
	| SubqueryExpr
	| VarExpr;

export type BinaryExpr = { type: typeof ExprType.Binary; loc?: Loc; op: BinaryOperator; left: Expr; right: Expr };
export type CaseExpr = {
	type: typeof ExprType.Case;
	loc?: Loc;
	condition?: Expr;
	cases: Array<{ when: Expr; then: Expr }>;
	else?: Expr;
};
/**
 * Source range, only present when parsed with `locations: true`.
 * Offsets are into the input string, `sql.slice(loc.start, loc.end)` gives the node text.
 */
export type Loc = { start: number; end: number };

/** A lexical comment, including native MySQL optimizer hints and executable comments. */
export type CommentNode = {
	type: typeof NodeType.Comment;
	kind: CommentKind;
	/** Exact source, including delimiters; line-ending characters are not included. */
	raw: string;
	/** Content without delimiters, the hint marker, or a recognized version prefix. */
	value: string;
	/** Always present, measured in UTF-16 offsets into the original SQL. */
	loc: Loc;
	/** Native MySQL Mmmrr / MMmmrr version guard, e.g. 80000. */
	version?: number;
	/** Executable payload range. Absent for comments MySQL treats as ordinary trivia. */
	body?: Loc;
};

/** Full parse result. Comments stay in source order, including trivia-only scripts. */
export type MysqlScript = {
	type: typeof NodeType.Script;
	statements: Statement[];
	comments: CommentNode[];
	loc: Loc;
};

export type CompareExpr = {
	type: typeof ExprType.Compare;
	loc?: Loc;
	op: CompareOperator;
	left: Expr;
	right: Expr;
	/** `LIKE x ESCAPE '!'` */
	escape?: Expr;
	/** `= ANY (subquery)` */
	quantifier?: CompareQuantifier;
};
export type FuncExpr = {
	type: typeof ExprType.Func;
	loc?: Loc;
	name: string;
	/** `db.fn()` – stored/user defined function */
	db?: string;
	/** `` `fn`() ``: a quoted name calls a stored function, never the built-in of the same name */
	quoted?: true;
	/** `COUNT (a)`: whitespace before `(` makes a space-sensitive built-in an ordinary call (MySQL) */
	spaced?: true;
	args: Expr[];
	distinct?: boolean;
	/** GROUP_CONCAT(... ORDER BY ...) */
	orderBy?: OrderByItem[];
	/** GROUP_CONCAT(... SEPARATOR ',') */
	separator?: Expr;
	/** TRIM(LEADING 'x' FROM s) → args: [s, 'x'] */
	trim?: TrimDirection;
	over?: WindowSpec | string;
};
/** row constructor `(a, b)` */
export type RowExpr = { type: typeof ExprType.Row; loc?: Loc; items: Expr[] };
/** doris array literal `[1, 2]` */
export type ArrayExpr = { type: typeof ExprType.Array; loc?: Loc; items: Expr[] };
/** doris `GROUP BY GROUPING SETS ((a, b), (a), ())` */
export type GroupingSetsExpr = { type: typeof ExprType.GroupingSets; loc?: Loc; sets: Expr[][] };
export type LiteralExpr = {
	type: typeof ExprType.Literal;
	loc?: Loc;
	value: string | number | boolean | null;
	/** hex/bit literal, typed temporal literal, or number beyond safe integer kept as string */
	kind?: LiteralKind;
	/** `_utf8mb4'abc'`, `N'abc'` */
	charset?: string;
};
export type LogicExpr = { type: typeof ExprType.Logic; loc?: Loc; op: LogicOperator; exprs: Expr[] };
/**
 * Qualified object name, `catalog` is doris only.
 */
export type QualifiedName = { catalog?: string; db?: string; name: string };

/**
 * Column reference `a`, `t.a`, `db.t.a`, doris `ctl.db.t.a`.
 *
 * Without schema `s.f` (doris struct field) can not be told apart from `table.column`, it is parsed as the latter.
 */
export type ColumnExpr = {
	type: typeof ExprType.Column;
	loc?: Loc;
	catalog?: string;
	db?: string;
	table?: string;
	name: string;
};
/** `*`, `t.*`, `db.t.*` */
export type StarExpr = { type: typeof ExprType.Star; loc?: Loc; catalog?: string; db?: string; table?: string };
export type UnaryExpr = { type: typeof ExprType.Unary; loc?: Loc; op: UnaryOperator; expr: Expr };

/** `expr [NOT] BETWEEN low AND high` */
export type BetweenExpr = {
	type: typeof ExprType.Between;
	loc?: Loc;
	not?: boolean;
	expr: Expr;
	low: Expr;
	high: Expr;
};
/** `EXISTS (subquery)`, `NOT EXISTS` is `Unary NOT` of this */
export type ExistsExpr = { type: typeof ExprType.Exists; loc?: Loc; query: QueryStatement };
/** `expr [NOT] IN (list)` or `expr [NOT] IN (subquery)`, exactly one of `list` / `query` is set */
export type InExpr = {
	type: typeof ExprType.In;
	loc?: Loc;
	not?: boolean;
	expr: Expr;
	list?: Expr[];
	query?: QueryStatement;
};

export type CastExpr = {
	type: typeof ExprType.Cast;
	loc?: Loc;
	expr: Expr;
	/** normalized upper case data type, e.g. `DECIMAL(10,2)`, `ARRAY<INT>` */
	dataType?: string;
	/** CONVERT(expr USING charset) */
	charset?: string;
	fn?: CastFunction;
};
export type CollateExpr = { type: typeof ExprType.Collate; loc?: Loc; expr: Expr; collation: string };
/** doris `arr[1]`, `m['k']` */
export type SubscriptExpr = { type: typeof ExprType.Subscript; loc?: Loc; expr: Expr; index: Expr };
export type IntervalExpr = { type: typeof ExprType.Interval; loc?: Loc; expr: Expr; unit: string };
/** bare keywords used as values: DEFAULT, UNKNOWN, interval unit in EXTRACT, ... */
export type KeywordExpr = { type: typeof ExprType.Keyword; loc?: Loc; value: string };
/** doris `x -> x + 1`, `(x, y) -> x + y` */
export type LambdaExpr = { type: typeof ExprType.Lambda; loc?: Loc; params: string[]; body: Expr };
export type MatchExpr = { type: typeof ExprType.Match; loc?: Loc; columns: Expr[]; against: Expr; mode?: string };
/** `?` placeholder */
export type ParamExpr = { type: typeof ExprType.Param; loc?: Loc; index: number };
/** scalar/row subquery `(SELECT ...)`, also the right side of `= ANY (SELECT ...)` */
export type SubqueryExpr = { type: typeof ExprType.Subquery; loc?: Loc; query: QueryStatement };
/** `@a`, `@@global.x` */
export type VarExpr = {
	type: typeof ExprType.Var;
	loc?: Loc;
	name: string;
	scope: VarScope;
};

export type OrderByItem = { expr: Expr; order?: SortOrder; nulls?: NullsOrder };
export type WindowSpec = {
	name?: string;
	partitionBy?: Expr[];
	orderBy?: OrderByItem[];
	frame?: WindowFrame;
};

export type WindowFrame = {
	unit: WindowFrameUnit;
	start: WindowFrameBound;
	/** Absent for the single-bound form, whose end is implicitly CURRENT ROW. */
	end?: WindowFrameBound;
};
export type WindowFrameBound =
	| { kind: typeof WindowFrameBoundKind.Current }
	| { kind: typeof WindowFrameBoundKind.Unbounded; direction: WindowFrameDirection }
	| { kind: typeof WindowFrameBoundKind.Offset; direction: WindowFrameDirection; value: Expr };

export type LockingClause = {
	mode: LockMode;
	/** Names/aliases following OF, preserving identifier spelling. */
	tables?: Array<QualifiedName & { star?: boolean }>;
	wait?: LockWait;
	/** Preserve the legacy LOCK IN SHARE MODE spelling. */
	legacy?: boolean;
};

// ---------------------------------------------------------------------------
// Statements
// ---------------------------------------------------------------------------

export type Statement =
	| SelectStatement
	| SetOpStatement
	| QueryGroup
	| InsertStatement
	| UpdateStatement
	| DeleteStatement
	| UseStatement
	| SetStatement
	| ExplainStatement
	| DescribeStatement
	| DropStatement
	| TruncateStatement
	| CreateStatement
	| CreateIndexStatement
	| AlterTableStatement
	| LoadDataStatement
	| RenameStatement
	| LockTablesStatement
	| UnknownStatement;

export type QueryStatement = SelectStatement | SetOpStatement | QueryGroup;

/** Parenthesized query expression, with its own outer query tail and CTE scope. */
export type QueryGroup = {
	type: typeof StatementType.QueryGroup;
	loc?: Loc;
	with?: WithClause;
	query: QueryStatement;
	orderBy?: OrderByItem[];
	limit?: LimitClause;
	into?: IntoClause;
};

export type WithClause = {
	recursive?: boolean;
	ctes: Array<{ name: string; columns?: string[]; query: QueryStatement }>;
};

export type SelectStatement = {
	type: typeof StatementType.Select;
	loc?: Loc;
	with?: WithClause;
	distinct?: boolean;
	/** HIGH_PRIORITY, STRAIGHT_JOIN, SQL_NO_CACHE, ... */
	options?: string[];
	columns: SelectColumn[];
	into?: IntoClause;
	from?: TableExpr[];
	/** doris/hive `LATERAL VIEW explode(arr) t AS c` */
	lateralViews?: LateralView[];
	where?: Expr;
	groupBy?: { items: Expr[]; rollup?: boolean };
	having?: Expr;
	windows?: Array<{ name: string; spec: WindowSpec }>;
	/** Doris post-window filter. */
	qualify?: Expr;
	orderBy?: OrderByItem[];
	limit?: LimitClause;
	locking?: LockingClause[];
};

export type SetOpStatement = {
	type: typeof StatementType.SetOp;
	loc?: Loc;
	with?: WithClause;
	op: SetOperator;
	all?: boolean;
	distinct?: boolean;
	left: QueryStatement;
	right: QueryStatement;
	orderBy?: OrderByItem[];
	limit?: LimitClause;
	/** Destination of the entire set operation, rather than its final operand. */
	into?: IntoClause;
};

export type SelectColumn = { expr: Expr; alias?: string };
export type LimitClause = { count: Expr; offset?: Expr };
export type IntoClause =
	| { kind: typeof IntoKind.Outfile | typeof IntoKind.Dumpfile; file: string; options?: OutfileOptions }
	| { kind: typeof IntoKind.Var; vars: VarExpr[] };
export type OutfileOptions =
	| {
			kind: typeof OutfileOptionsKind.Mysql;
			charset?: string;
			fields?: { terminatedBy?: string; enclosedBy?: string; optionally?: boolean; escapedBy?: string };
			lines?: { startingBy?: string; terminatedBy?: string };
	  }
	| { kind: typeof OutfileOptionsKind.Doris; format: string; properties?: Array<{ name: string; value: string }> };
export type LateralView = { outer?: boolean; func: FuncExpr; alias: string; columns?: string[] };

export type TableExpr = TableName | DerivedTable | TableFunction | JsonTable | JoinTable;

export type TableName = QualifiedName & {
	type: typeof TableExprType.Table;
	loc?: Loc;
	/** The `DUAL` keyword (no table) rather than a table named dual (`` `dual` ``). */
	dual?: true;
	alias?: string;
	partition?: string[];
	temporaryPartition?: boolean;
	/** doris `TABLET(10001, 10002)` */
	tablet?: number[];
	indexHints?: IndexHint[];
};
export type IndexHint = {
	kind: IndexHintKind;
	scope?: IndexHintScope;
	indexes: string[];
};
/** derived table `(SELECT ...) AS t` */
export type DerivedTable = {
	type: typeof TableExprType.Derived;
	loc?: Loc;
	query: QueryStatement;
	alias?: string;
	columns?: string[];
	lateral?: boolean;
};
export type TableFunction = { type: typeof TableExprType.TableFunc; loc?: Loc; func: FuncExpr; alias?: string };
export type JsonTable = {
	type: typeof TableExprType.JsonTable;
	loc?: Loc;
	expr: Expr;
	path: string;
	columns: JsonTableColumn[];
	alias: string;
};
export type JsonTableColumn =
	| { kind: typeof JsonTableColumnKind.Ordinality; name: string }
	| {
			kind: typeof JsonTableColumnKind.Path;
			name: string;
			dataType: string;
			path: string;
			exists?: true;
			onEmpty?: JsonTableResponse;
			onError?: JsonTableResponse;
	  }
	| { kind: typeof JsonTableColumnKind.Nested; path: string; columns: JsonTableColumn[] };
export type JsonTableResponse =
	| { action: typeof JsonTableResponseAction.Null | typeof JsonTableResponseAction.Error }
	| { action: typeof JsonTableResponseAction.Default; value: string };
export type JoinTable = {
	type: typeof TableExprType.Join;
	loc?: Loc;
	join: JoinType;
	natural?: boolean;
	left: TableExpr;
	right: TableExpr;
	on?: Expr;
	using?: string[];
	/** doris join hint `JOIN [shuffle]` */
	hint?: string;
};

export type Assignment = { column: ColumnExpr; value: Expr };

export type InsertStatement = {
	type: typeof StatementType.Insert;
	loc?: Loc;
	with?: WithClause;
	replace?: boolean;
	/** doris INSERT OVERWRITE */
	overwrite?: boolean;
	ignore?: boolean;
	priority?: InsertPriority;
	table: TableName;
	/** doris `WITH LABEL x` */
	label?: string;
	columns?: string[];
	values?: Expr[][];
	/** `VALUES (...) AS new` */
	valuesAlias?: string;
	query?: QueryStatement;
	set?: Assignment[];
	onDuplicateUpdate?: Assignment[];
};

export type UpdateStatement = {
	type: typeof StatementType.Update;
	loc?: Loc;
	with?: WithClause;
	priority?: typeof InsertPriority.LowPriority;
	ignore?: boolean;
	tables: TableExpr[];
	set: Assignment[];
	/** doris `UPDATE t SET ... FROM t2` */
	from?: TableExpr[];
	where?: Expr;
	orderBy?: OrderByItem[];
	limit?: LimitClause;
};

export type DeleteStatement = {
	type: typeof StatementType.Delete;
	loc?: Loc;
	with?: WithClause;
	options?: string[];
	/** multi-table targets: `DELETE t1, t2 FROM refs` / `DELETE FROM t1, t2 USING refs`, refs are kept in `from` */
	targets?: TableName[];
	from: TableExpr[];
	/** doris `DELETE FROM t USING refs` */
	using?: TableExpr[];
	where?: Expr;
	orderBy?: OrderByItem[];
	limit?: LimitClause;
};

/** `USE db`, doris `USE ctl.db` */
export type UseStatement = { type: typeof StatementType.Use; loc?: Loc; catalog?: string; db: string };
export type SetStatement = {
	type: typeof StatementType.Set;
	loc?: Loc;
	assignments: Array<{ target: VarExpr; value: Expr }>;
};
export type ExplainStatement = {
	type: typeof StatementType.Explain;
	loc?: Loc;
	options?: string[];
	statement: Statement;
};
export type DescribeStatement = { type: typeof StatementType.Describe; loc?: Loc; table: TableName };
export type DropStatement = {
	type: typeof StatementType.Drop;
	loc?: Loc;
	object: SchemaObject;
	temporary?: boolean;
	ifExists?: boolean;
	/** for DATABASE only `catalog` / `name` are used */
	names: QualifiedName[];
	force?: boolean;
};
export type TruncateStatement = { type: typeof StatementType.Truncate; loc?: Loc; table: TableName };

/** Structured DDL shell. `definition` preserves the part not modeled yet. */
export type CreateStatement = {
	type: typeof StatementType.Create;
	loc?: Loc;
	object: SchemaObject;
	temporary?: boolean;
	ifNotExists?: boolean;
	replace?: boolean;
	name: QualifiedName;
	definition?: string;
	options?: string;
	query?: QueryStatement;
	like?: QualifiedName;
	queryModifier?: CreateQueryModifier;
	withCheckOption?: string;
	references?: QualifiedName[];
};
export type CreateIndexStatement = {
	type: typeof StatementType.CreateIndex;
	loc?: Loc;
	unique?: boolean;
	kind?: IndexKind;
	index: string;
	table: TableName;
	definition?: string;
	prefix?: string;
	options?: string;
};
export type AlterTableStatement = {
	type: typeof StatementType.AlterTable;
	loc?: Loc;
	modifier?: AlterTableModifier;
	table: TableName;
	/** normalized raw action, retained until the operation has a dedicated AST node */
	action: string;
	actions?: AlterAction[];
	renameTo?: QualifiedName;
	exchangeTable?: QualifiedName;
	references?: QualifiedName[];
};
export type AlterAction = {
	action: string;
	renameTo?: QualifiedName;
	exchangeTable?: QualifiedName;
	references?: QualifiedName[];
};
export type LoadDataStatement = {
	type: typeof StatementType.LoadData;
	loc?: Loc;
	local?: boolean;
	file: string;
	table: TableName;
	partition?: string[];
	priority?: LoadDataPriority;
	replace?: boolean;
	ignore?: boolean;
	options?: string;
	set?: Assignment[];
};
export type RenameStatement = {
	type: typeof StatementType.Rename;
	loc?: Loc;
	renames: Array<{ from: QualifiedName; to: QualifiedName }>;
};
export type LockTablesStatement = {
	type: typeof StatementType.LockTables;
	loc?: Loc;
	locks: Array<{ table: TableName; mode: string }>;
};
/** Statement not modeled yet (CREATE/ALTER/SHOW/GRANT/...), kept as raw text for auditing. */
export type UnknownStatement = { type: typeof StatementType.Unknown; loc?: Loc; keyword: string; text: string };

export type Node = Expr | Statement | TableExpr | CommentNode | MysqlScript;

// Compile-time checks: node unions and the `*Type` constants describe the same set of discriminants.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;
type _NodeTypeChecks = [
	Assert<Same<Expr['type'], ExprType>>,
	Assert<Same<QueryStatement['type'], QueryType>>,
	Assert<Same<Statement['type'], StatementType>>,
	Assert<Same<TableExpr['type'], TableExprType>>,
	Assert<Same<Node['type'], NodeType>>,
];
