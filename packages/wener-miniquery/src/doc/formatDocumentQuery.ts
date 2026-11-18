import { formatQuery } from '../ast/formatQuery';
import { type DocumentQueryOptions, documentQueryConditions } from './documentQueryToExpr';
import type { DocumentQueryInput } from './types';

export type FormatDocumentQueryOptions = DocumentQueryOptions;

/**
 * Format a document query as MiniQuery conditions, one per top-level condition, to be combined with AND.
 * Each string parses with `parseQuery`. Use `documentQueryToExpr` for the expression itself.
 */
export function formatDocumentQuery(
	query: DocumentQueryInput | null | undefined,
	options?: FormatDocumentQueryOptions,
): string[] {
	return documentQueryConditions(query, options).map(formatQuery);
}
