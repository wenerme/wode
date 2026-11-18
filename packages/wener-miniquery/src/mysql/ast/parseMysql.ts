import { parse } from './parser';
import type { MysqlDialect } from './const';
import type { CommentNode, Expr, MysqlScript, Statement } from './types';

export interface ParseMysqlOptions {
	dialect?: MysqlDialect;
	/** Parse executable-comment payloads for auditing. Defaults to true. */
	executableComments?: boolean;
	/**
	 * MySQL server version as Mmmrr / MMmmrr, e.g. 80400. Without a version,
	 * include every executable payload conservatively; this does not predict execution.
	 */
	mysqlVersion?: number;
	/** Attach source offsets to semantic nodes. Comment offsets are always present. */
	locations?: boolean;
}

/** Parse statements only. Use parseMysqlScript when comments and hints are needed. */
export function parseMysql(sql: string, options: ParseMysqlOptions = {}): Statement[] {
	return parseMysqlScript(sql, options).statements;
}

/** Capture all comments alongside semantic statements without relocating any hint. */
export function parseMysqlScript(sql: string, options: ParseMysqlOptions = {}): MysqlScript {
	const comments = scanMysqlComments(sql);
	const input = prepareInput(sql, comments, options);
	return {
		type: 'Script',
		statements: parse(input, { dialect: options.dialect ?? 'mysql', locations: options.locations }) as Statement[],
		comments,
		loc: { start: 0, end: sql.length },
	};
}

/** Scan native comment tokens even when the SQL statement itself is not modeled. */
export function scanMysqlComments(sql: string): CommentNode[] {
	return parse(sql, { startRule: 'Comments' }) as CommentNode[];
}

/** Parse a single expression, using the same executable-comment handling as statements. */
export function parseMysqlExpr(expr: string, options: ParseMysqlOptions = {}): Expr {
	return parse(prepareInput(expr, scanMysqlComments(expr), options), {
		dialect: options.dialect ?? 'mysql',
		locations: options.locations,
		startRule: 'Expression',
	}) as Expr;
}

/** Expand active native executable-comment delimiters, retaining UTF-16 offsets and line endings. */
export function expandExecutableComments(sql: string, mysqlVersion?: number): string {
	return expand(sql, scanMysqlComments(sql), mysqlVersion);
}

function prepareInput(sql: string, comments: CommentNode[], options: ParseMysqlOptions): string {
	return options.executableComments === false ? sql : expand(sql, comments, options.mysqlVersion);
}

function expand(sql: string, comments: CommentNode[], mysqlVersion?: number): string {
	if (mysqlVersion !== undefined && (!Number.isSafeInteger(mysqlVersion) || mysqlVersion < 0)) {
		throw new RangeError('mysqlVersion must be a non-negative integer');
	}
	const out = sql.split('');
	for (const comment of comments) {
		if (
			!comment.body ||
			(mysqlVersion !== undefined && comment.version !== undefined && mysqlVersion < comment.version)
		) {
			continue;
		}
		for (let i = comment.loc.start; i < comment.body.start; i++) out[i] = ' ';
		for (let i = comment.body.end; i < comment.loc.end; i++) out[i] = ' ';
	}
	return out.join('');
}
