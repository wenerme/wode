import { NodeType, StatementType } from './const';
import { formatExpr } from './formatExpr';
import { formatStatement } from './formatStatement';
import type { CommentNode, Expr, Statement } from './types';

export { formatExpr } from './formatExpr';
export { formatQuery } from './formatQuery';
export { formatStatement } from './formatStatement';
export { quoteIdent, quoteString } from './quote';

const STATEMENT_TYPES: ReadonlySet<string> = new Set(Object.values(StatementType));

function isStatement(node: Statement | Expr): node is Statement {
	return STATEMENT_TYPES.has(node.type);
}

/**
 * Format MySQL AST back to SQL. Output is normalized (upper case keywords, explicit parentheses)
 * and re-parses to the same semantic AST. Statements do not contain trivia;
 * format individual CommentNodes to reproduce their exact source. A MysqlScript
 * is deliberately not accepted: moving hints or version guards changes SQL semantics.
 */
export function formatMysql(node: Statement | Statement[] | Expr | CommentNode): string {
	if (Array.isArray(node)) return node.map(formatStatement).join(';\n');
	if (node.type === NodeType.Comment) return node.raw;
	if (isStatement(node)) return formatStatement(node);
	return formatExpr(node);
}
