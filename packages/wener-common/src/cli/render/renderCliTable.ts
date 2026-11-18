import { formatCliTable } from '../format/formatCliTable';
import type { CliFormatOptions } from '../format/types';
import type { CliTable } from './CliTable';

export type RenderCliTableOptions = CliFormatOptions & { columns?: number };

export function renderCliTable(table: CliTable, options: RenderCliTableOptions = {}): string {
	const { columns, ...formatOptions } = options;
	return formatCliTable({ ...table, kind: table.kind ?? 'plain' }, { ...formatOptions, w: formatOptions.w ?? columns });
}
