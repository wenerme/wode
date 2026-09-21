import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataViewFilter, DataViewSort, DataViewViewSwitcher, getNextVisibleColumnIds } from './data-view-controls';

describe('data view controls', () => {
	it('renders controlled sort, filter, and open-ended view modes', () => {
		const markup = renderToStaticMarkup(
			<>
				<DataViewSort
					value='updated-desc'
					options={[
						{ value: 'updated-desc', label: '最近更新' },
						{ value: 'name-asc', label: '名称' },
					]}
					onValueChange={() => undefined}
				/>
				<DataViewFilter activeCount={2} />
				<DataViewViewSwitcher
					value='sheet'
					options={[
						{ value: 'table', label: '表格' },
						{ value: 'list', label: '列表' },
						{ value: 'sheet', label: '工作表' },
					]}
					onValueChange={() => undefined}
				/>
			</>,
		);

		expect(markup).toContain('aria-label="排序"');
		expect(markup).toContain('aria-pressed="true"');
		expect(markup).toContain('aria-label="工作表"');
		expect(markup).toContain('>2</span>');
	});

	it('keeps required columns and prevents an empty visible set', () => {
		const columns = [
			{ id: 'name', label: '名称', hideable: false },
			{ id: 'owner', label: '负责人' },
			{ id: 'status', label: '状态' },
		] as const;

		expect(getNextVisibleColumnIds(columns, ['name', 'owner'], 'owner', false)).toEqual(['name']);
		expect(getNextVisibleColumnIds(columns, ['owner'], 'owner', false)).toEqual(['name']);
		expect(getNextVisibleColumnIds(columns, ['name'], 'status', true)).toEqual(['name', 'status']);
		expect(getNextVisibleColumnIds([{ id: 'owner', label: '负责人' }], ['owner'], 'owner', false)).toEqual(['owner']);
	});
});
