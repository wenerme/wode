import type { CliTable } from '../render/CliTable';
import { CliFormatError } from './types';

export function cliFieldKey(header: string): string {
	return header.trim().toLowerCase().replace(/\s+/gu, '_');
}

/** 精确字段名优先；大小写或展示别名不能静默选择另一个值。 */
export function findCliFieldIndex(field: string, keys: readonly string[], labels: readonly string[] = []): number {
	const unique = (indices: number[]) => {
		if (indices.length > 1) throw new CliFormatError(`Ambiguous field: ${field}`);
		return indices[0] ?? -1;
	};
	const exactKey = unique(keys.flatMap((key, index) => (key === field ? [index] : [])));
	if (exactKey >= 0) return exactKey;
	const exactLabel = unique(labels.flatMap((label, index) => (label === field ? [index] : [])));
	if (exactLabel >= 0) return exactLabel;
	return unique(
		keys.flatMap((key, index) =>
			cliFieldKey(key) === cliFieldKey(field) || cliFieldKey(labels[index] ?? '') === cliFieldKey(field) ? [index] : [],
		),
	);
}

export function isCliDetailTable(table: CliTable): boolean {
	if (table.kind !== undefined) return table.kind === 'detail';
	return (
		table.headers.length === 2 && cliFieldKey(table.headers[0]) === 'field' && cliFieldKey(table.headers[1]) === 'value'
	);
}

/** 详情投影选择字段行；列表投影选择稳定列。 */
export function projectCliTable(table: CliTable, fields: readonly string[] | undefined): CliTable {
	if (!fields?.length) return table;
	if (isCliDetailTable(table)) {
		const rows = fields.map((field) => {
			const row =
				table.rows[
					findCliFieldIndex(
						field,
						table.rows.map((candidate) => String(candidate[0])),
					)
				];
			if (!row) throw new CliFormatError(`Unknown field: ${field}`);
			return row;
		});
		return { ...table, kind: 'detail', rows };
	}
	const selected = fields.map((field) => {
		const index = findCliFieldIndex(
			field,
			table.headers.map((header, index) => table.columnOptions?.[index]?.key ?? header),
			table.headers,
		);
		if (index < 0) throw new CliFormatError(`Unknown field: ${field}`);
		return index;
	});
	return {
		...table,
		headers: selected.map((index) => table.headers[index]),
		rows: table.rows.map((row) => selected.map((index) => row[index])),
		columnOptions: selected.map((index) => ({
			...table.columnOptions?.[index],
			key: table.columnOptions?.[index]?.key ?? cliFieldKey(table.headers[index]),
		})),
	};
}
