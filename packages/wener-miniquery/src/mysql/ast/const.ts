/**
 * Constant values of the MySQL / Doris AST.
 *
 * Each constant is a frozen-shape object with a type of the same name, so it can be used both as a
 * value (`ExprType.Column`) and as a type (`ExprType`). Values are the literal strings stored in the AST.
 */

type ValueOf<T> = T[keyof T];

export const MysqlDialect = {
	Mysql: 'mysql',
	Doris: 'doris',
} as const;
export type MysqlDialect = ValueOf<typeof MysqlDialect>;

// ---------------------------------------------------------------------------
// Node types
// ---------------------------------------------------------------------------

export const ExprType = {
	Binary: 'Binary',
	Case: 'Case',
	Compare: 'Compare',
	Func: 'Func',
	Row: 'Row',
	Literal: 'Literal',
	Logic: 'Logic',
	Column: 'Column',
	Star: 'Star',
	Unary: 'Unary',
	Between: 'Between',
	Exists: 'Exists',
	In: 'In',
	Cast: 'Cast',
	Collate: 'Collate',
	Array: 'Array',
	GroupingSets: 'GroupingSets',
	Subscript: 'Subscript',
	Interval: 'Interval',
	Keyword: 'Keyword',
	Lambda: 'Lambda',
	Match: 'Match',
	Param: 'Param',
	Subquery: 'Subquery',
	Var: 'Var',
} as const;
export type ExprType = ValueOf<typeof ExprType>;

/** Query expressions, a subset of {@link StatementType}. */
export const QueryType = {
	Select: 'Select',
	SetOp: 'SetOp',
	QueryGroup: 'QueryGroup',
} as const;
export type QueryType = ValueOf<typeof QueryType>;

export const StatementType = {
	...QueryType,
	Insert: 'Insert',
	Update: 'Update',
	Delete: 'Delete',
	Use: 'Use',
	Set: 'Set',
	Explain: 'Explain',
	Describe: 'Describe',
	Drop: 'Drop',
	Truncate: 'Truncate',
	Create: 'Create',
	CreateIndex: 'CreateIndex',
	AlterTable: 'AlterTable',
	LoadData: 'LoadData',
	Rename: 'Rename',
	LockTables: 'LockTables',
	Unknown: 'Unknown',
} as const;
export type StatementType = ValueOf<typeof StatementType>;

export const TableExprType = {
	Table: 'Table',
	Derived: 'Derived',
	TableFunc: 'TableFunc',
	JsonTable: 'JsonTable',
	Join: 'Join',
} as const;
export type TableExprType = ValueOf<typeof TableExprType>;

/** Every AST node `type`. */
export const NodeType = {
	...ExprType,
	...StatementType,
	...TableExprType,
	Comment: 'Comment',
	Script: 'Script',
} as const;
export type NodeType = ValueOf<typeof NodeType>;

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------

export const LogicOperator = {
	And: 'AND',
	Or: 'OR',
	Xor: 'XOR',
} as const;
export type LogicOperator = ValueOf<typeof LogicOperator>;

export const UnaryOperator = {
	Not: 'NOT',
	Bang: '!',
	Minus: '-',
	Plus: '+',
	BitNot: '~',
	Binary: 'BINARY',
} as const;
export type UnaryOperator = ValueOf<typeof UnaryOperator>;

export const CompareOperator = {
	Equal: '=',
	NullSafeEqual: '<=>',
	NotEqual: '!=',
	LessGreater: '<>',
	Greater: '>',
	GreaterEqual: '>=',
	Less: '<',
	LessEqual: '<=',
	Like: 'LIKE',
	NotLike: 'NOT LIKE',
	Regexp: 'REGEXP',
	NotRegexp: 'NOT REGEXP',
	Rlike: 'RLIKE',
	NotRlike: 'NOT RLIKE',
	Is: 'IS',
	IsNot: 'IS NOT',
	MemberOf: 'MEMBER OF',
} as const;
export type CompareOperator = ValueOf<typeof CompareOperator>;

export const BinaryOperator = {
	Add: '+',
	Subtract: '-',
	Multiply: '*',
	Divide: '/',
	Modulo: '%',
	Div: 'DIV',
	Mod: 'MOD',
	BitAnd: '&',
	BitOr: '|',
	BitXor: '^',
	ShiftLeft: '<<',
	ShiftRight: '>>',
	JsonExtract: '->',
	JsonUnquote: '->>',
	Assign: ':=',
} as const;
export type BinaryOperator = ValueOf<typeof BinaryOperator>;

/** `= ANY (subquery)` */
export const CompareQuantifier = {
	Any: 'ANY',
	All: 'ALL',
	Some: 'SOME',
} as const;
export type CompareQuantifier = ValueOf<typeof CompareQuantifier>;

export const SetOperator = {
	Union: 'UNION',
	Except: 'EXCEPT',
	Intersect: 'INTERSECT',
	/** Doris alias of EXCEPT. */
	Minus: 'MINUS',
} as const;
export type SetOperator = ValueOf<typeof SetOperator>;

// ---------------------------------------------------------------------------
// Expression details
// ---------------------------------------------------------------------------

export const LiteralKind = {
	Hex: 'hex',
	Bit: 'bit',
	Date: 'date',
	Time: 'time',
	Timestamp: 'timestamp',
	/** Number beyond the safe integer range, kept as string. */
	Number: 'number',
} as const;
export type LiteralKind = ValueOf<typeof LiteralKind>;

export const VarScope = {
	User: 'user',
	System: 'system',
	Global: 'global',
	Session: 'session',
	Local: 'local',
	Persist: 'persist',
} as const;
export type VarScope = ValueOf<typeof VarScope>;

export const CastFunction = {
	Cast: 'CAST',
	Convert: 'CONVERT',
} as const;
export type CastFunction = ValueOf<typeof CastFunction>;

export const TrimDirection = {
	Both: 'BOTH',
	Leading: 'LEADING',
	Trailing: 'TRAILING',
} as const;
export type TrimDirection = ValueOf<typeof TrimDirection>;

export const SortOrder = {
	Asc: 'ASC',
	Desc: 'DESC',
} as const;
export type SortOrder = ValueOf<typeof SortOrder>;

export const NullsOrder = {
	First: 'FIRST',
	Last: 'LAST',
} as const;
export type NullsOrder = ValueOf<typeof NullsOrder>;

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

export const WindowFrameUnit = {
	Rows: 'ROWS',
	Range: 'RANGE',
} as const;
export type WindowFrameUnit = ValueOf<typeof WindowFrameUnit>;

export const WindowFrameBoundKind = {
	Current: 'current',
	Unbounded: 'unbounded',
	Offset: 'offset',
} as const;
export type WindowFrameBoundKind = ValueOf<typeof WindowFrameBoundKind>;

export const WindowFrameDirection = {
	Preceding: 'PRECEDING',
	Following: 'FOLLOWING',
} as const;
export type WindowFrameDirection = ValueOf<typeof WindowFrameDirection>;

// ---------------------------------------------------------------------------
// Query tail
// ---------------------------------------------------------------------------

export const LockMode = {
	Update: 'UPDATE',
	Share: 'SHARE',
} as const;
export type LockMode = ValueOf<typeof LockMode>;

export const LockWait = {
	Nowait: 'NOWAIT',
	SkipLocked: 'SKIP LOCKED',
} as const;
export type LockWait = ValueOf<typeof LockWait>;

export const IntoKind = {
	Outfile: 'OUTFILE',
	Dumpfile: 'DUMPFILE',
	Var: 'VAR',
} as const;
export type IntoKind = ValueOf<typeof IntoKind>;

export const OutfileOptionsKind = {
	Mysql: 'mysql',
	Doris: 'doris',
} as const;
export type OutfileOptionsKind = ValueOf<typeof OutfileOptionsKind>;

// ---------------------------------------------------------------------------
// Table expressions
// ---------------------------------------------------------------------------

export const JoinType = {
	Join: 'JOIN',
	InnerJoin: 'INNER JOIN',
	CrossJoin: 'CROSS JOIN',
	StraightJoin: 'STRAIGHT_JOIN',
	LeftJoin: 'LEFT JOIN',
	RightJoin: 'RIGHT JOIN',
	FullJoin: 'FULL JOIN',
	LeftSemiJoin: 'LEFT SEMI JOIN',
	RightSemiJoin: 'RIGHT SEMI JOIN',
	LeftAntiJoin: 'LEFT ANTI JOIN',
	RightAntiJoin: 'RIGHT ANTI JOIN',
} as const;
export type JoinType = ValueOf<typeof JoinType>;

export const IndexHintKind = {
	Use: 'USE',
	Force: 'FORCE',
	Ignore: 'IGNORE',
} as const;
export type IndexHintKind = ValueOf<typeof IndexHintKind>;

export const IndexHintScope = {
	Join: 'JOIN',
	OrderBy: 'ORDER BY',
	GroupBy: 'GROUP BY',
} as const;
export type IndexHintScope = ValueOf<typeof IndexHintScope>;

export const JsonTableColumnKind = {
	Ordinality: 'ordinality',
	Path: 'path',
	Nested: 'nested',
} as const;
export type JsonTableColumnKind = ValueOf<typeof JsonTableColumnKind>;

export const JsonTableResponseAction = {
	Null: 'NULL',
	Error: 'ERROR',
	Default: 'DEFAULT',
} as const;
export type JsonTableResponseAction = ValueOf<typeof JsonTableResponseAction>;

// ---------------------------------------------------------------------------
// Statements
// ---------------------------------------------------------------------------

export const SchemaObject = {
	Table: 'TABLE',
	View: 'VIEW',
	Database: 'DATABASE',
} as const;
export type SchemaObject = ValueOf<typeof SchemaObject>;

export const IndexKind = {
	Index: 'INDEX',
	Fulltext: 'FULLTEXT',
	Spatial: 'SPATIAL',
} as const;
export type IndexKind = ValueOf<typeof IndexKind>;

export const InsertPriority = {
	LowPriority: 'LOW_PRIORITY',
	Delayed: 'DELAYED',
	HighPriority: 'HIGH_PRIORITY',
} as const;
export type InsertPriority = ValueOf<typeof InsertPriority>;

export const LoadDataPriority = {
	LowPriority: 'LOW_PRIORITY',
	Concurrent: 'CONCURRENT',
} as const;
export type LoadDataPriority = ValueOf<typeof LoadDataPriority>;

export const AlterTableModifier = {
	Online: 'ONLINE',
	Offline: 'OFFLINE',
	Ignore: 'IGNORE',
} as const;
export type AlterTableModifier = ValueOf<typeof AlterTableModifier>;

export const CreateQueryModifier = {
	Ignore: 'IGNORE',
	Replace: 'REPLACE',
} as const;
export type CreateQueryModifier = ValueOf<typeof CreateQueryModifier>;

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const CommentKind = {
	Block: 'block',
	Line: 'line',
	Hint: 'hint',
	Executable: 'executable',
} as const;
export type CommentKind = ValueOf<typeof CommentKind>;
