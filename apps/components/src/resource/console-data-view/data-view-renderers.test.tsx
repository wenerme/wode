import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataViewLayout } from './data-view-layout';
import {
	type DataViewColumn,
	DataViewListView,
	DataViewSheetView,
	DataViewTableView,
	getVisibleColumns,
} from './data-view-renderers';

type Row = { id: string; name: string; owner: string; status: string };

const rows: Row[] = [
	{ id: 'r-1', name: 'Alpha', owner: 'Lin', status: 'ready' },
	{ id: 'r-2', name: 'Beta', owner: 'Zhou', status: 'pending' },
];

const columns = [
	{ id: 'name', label: '名称', hideable: false, sortable: true, cell: (row: Row) => row.name },
	{ id: 'owner', label: '负责人', cell: (row: Row) => row.owner },
	{ id: 'status', label: '状态', cell: (row: Row) => row.status },
] as const satisfies readonly DataViewColumn<Row>[];

describe('data view renderers', () => {
	it('renders typed native table columns, sort, selection, and active row', () => {
		const markup = renderToStaticMarkup(
			<DataViewTableView
				aria-label='资源表格'
				rows={rows}
				columns={columns}
				visibleColumnIds={['name', 'status']}
				getRowId={(row) => row.id}
				getRowLabel={(row) => row.name}
				activeId='r-2'
				selectedIds={['r-1']}
				onActiveIdChange={() => undefined}
				onSelectedIdsChange={() => undefined}
				sort={{ columnId: 'name', direction: 'asc' }}
				onSortChange={() => undefined}
			/>,
		);

		expect(markup).toContain('<table');
		expect(markup).toContain('aria-label="资源表格"');
		expect(markup).toContain('aria-sort="ascending"');
		expect(markup).toContain('data-active="true"');
		expect(markup).toContain('checked=""');
		expect(markup).toContain('Alpha');
		expect(markup).not.toContain('负责人</th>');
	});

	it('shares active identity across list and sheet renderers', () => {
		const listMarkup = renderToStaticMarkup(
			<DataViewListView
				rows={rows}
				getRowId={(row) => row.id}
				activeId='r-2'
				selectedIds={['r-2']}
				renderItem={(row) => row.name}
			/>,
		);
		const sheetMarkup = renderToStaticMarkup(
			<DataViewSheetView
				rows={rows}
				columns={columns}
				getRowId={(row) => row.id}
				activeId='r-2'
				selectedIds={['r-2']}
			/>,
		);

		expect(listMarkup).toContain('aria-current="true"');
		expect(sheetMarkup).toContain('role="grid"');
		expect(sheetMarkup).toContain('aria-selected="true"');
		expect(sheetMarkup).toContain('data-active="true"');
		expect(DataViewLayout.List).toBe(DataViewListView);
		expect(DataViewLayout.Sheet).toBe(DataViewSheetView);
	});

	it('keeps required columns visible in declaration order', () => {
		expect(getVisibleColumns(columns, ['status']).map((column) => column.id)).toEqual(['name', 'status']);
	});

	it('keeps the sheet keyboard reachable when the active row leaves the current result set', () => {
		const markup = renderToStaticMarkup(
			<DataViewSheetView
				rows={rows}
				columns={columns}
				getRowId={(row) => row.id}
				activeId='missing'
				onActiveIdChange={() => undefined}
			/>,
		);
		expect(markup.match(/tabindex="0"/g)).toHaveLength(1);
	});
});
