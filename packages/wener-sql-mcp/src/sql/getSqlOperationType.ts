function getFirstKeyword(query: string): string {
	// Remove SQL line comments (--) and block comments (/* */)
	const cleanQuery = query
		.replace(/--.*$/gm, '') // Remove line comments
		.replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
		.trim()
		.toUpperCase();

	// If no content left after removing comments, return empty string
	if (!cleanQuery) {
		return '';
	}

	// Extract the first word (keyword)
	const firstWord = cleanQuery.split(/\s+/)[0];
	return firstWord || '';
}

/**
 * SQL operation types
 */
export const SqlOperationType = Object.freeze({
	QUERY: 'query',
	DML: 'dml',
	DDL: 'ddl',
	UNKNOWN: 'unknown',
} as const);
export type SqlOperationType = (typeof SqlOperationType)[keyof typeof SqlOperationType];

/**
 * Get the operation type of a SQL query
 * @param query - The SQL query string
 * @returns The operation type
 */
export function getSqlOperationType(query: string): SqlOperationType {
	const kw = getFirstKeyword(query);

	switch (kw) {
		case 'WITH': // NOTE Common Table Expression (CTE), usually followed by SELECT/INSERT/UPDATE/DELETE
		case 'SELECT':
		case 'SHOW':
		case 'DESCRIBE':
		case 'DESC':
		case 'EXPLAIN':
			return SqlOperationType.QUERY;
		case 'INSERT':
		case 'UPDATE':
		case 'DELETE':
		case 'MERGE':
		case 'REPLACE':
			return SqlOperationType.DML;
		case 'CREATE':
		case 'ALTER':
		case 'DROP':
		case 'TRUNCATE': // PostgreSQL 可以回滚，可以算作是 DML
		case 'RENAME':
			return SqlOperationType.DDL;
	}

	return SqlOperationType.UNKNOWN;
}
