import { getSqlOperationType, SqlOperationType } from './getSqlOperationType';

export function isQuerySql(query: string): boolean {
	return getSqlOperationType(query) === SqlOperationType.QUERY;
}

export function isDmlSql(query: string): boolean {
	return getSqlOperationType(query) === SqlOperationType.DML;
}

export function isDdlSql(query: string): boolean {
	return getSqlOperationType(query) === SqlOperationType.DDL;
}

export function validateTableName(tableName: string, escapeChar: string = '`'): string {
	if (!/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)?$/.test(tableName)) {
		throw new Error(`Invalid table name: ${tableName}`);
	}

	const parts = tableName.split('.');
	if (parts.length === 2) {
		return `${escapeChar}${parts[0]}${escapeChar}.${escapeChar}${parts[1]}${escapeChar}`;
	}
	return `${escapeChar}${tableName}${escapeChar}`;
}

export function formatResultsAsCsv(results: any[]): string {
	if (!results || results.length === 0) {
		return '';
	}

	const columns = Object.keys(results[0]);
	const csvRows = results.map((row: any) =>
		columns
			.map((col) => {
				const value = row[col];
				if (value === null || value === undefined) return '';
				if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
					return `"${value.replace(/"/g, '""')}"`;
				}
				return String(value);
			})
			.join(','),
	);
	return [columns.join(','), ...csvRows].join('\n');
}

export function formatResultsAsJson(results: any[]): string {
	return JSON.stringify(results, null, 2);
}
