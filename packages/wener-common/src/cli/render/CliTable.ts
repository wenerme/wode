export interface CliTable {
	headers: readonly string[];
	rows: readonly (readonly unknown[])[];
	footer?: string;
	emptyMessage?: string;
	kind?: 'list' | 'detail' | 'plain';
	title?: string;
	columnOptions?: readonly CliTableColumnOptions[];
	pagination?: CliTablePagination;
	countLabel?: string;
}

export interface CliTableColumnOptions {
	key?: string;
	truncate?: boolean;
	align?: 'left' | 'right';
	minWidth?: number;
	maxWidth?: number;
}

export interface CliTablePagination {
	total?: number;
	pageIndex?: number;
	pageSize?: number;
	offset?: number;
	hasNext?: boolean;
}
