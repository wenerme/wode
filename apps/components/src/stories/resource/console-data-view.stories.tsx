import type { Meta, StoryObj } from '@storybook/react-vite';
import { Database, Plus } from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
	DataView,
	type DataViewColumn,
	DataViewEmpty,
	DataViewHeader,
	DataViewLayout,
	DataViewSearch,
} from '@/resource/console-data-view';
import { Status } from '@/ui/status';
import { ConsoleDataViewDemo } from './data-view-demo';
import { DataViewResourceWorkspaceDemo } from './data-view-resource-workspace-demo';
import { createFakeDemoRecords } from './fake-data-view-records';
import { type DemoRecord, demoRecords } from './resource-fixtures';

const meta = {
	id: 'console-data-view',
	title: 'Resource/Data View',
	component: DataView,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'A presentational data workspace. Query state, caching, URL synchronization, and virtualization remain application concerns.',
			},
		},
	},
} satisfies Meta<typeof DataView>;

export default meta;
type Story = StoryObj<typeof meta>;

const largeDataset = createFakeDemoRecords(500);
const sheetColumns = [
	{ id: 'name', label: '名称', hideable: false, width: '16rem', cell: (row: DemoRecord) => row.name },
	{ id: 'type', label: '类型', width: '10rem', cell: (row: DemoRecord) => row.type },
	{ id: 'owner', label: '负责人', width: '8rem', cell: (row: DemoRecord) => row.owner },
	{ id: 'region', label: '区域', width: '9rem', cell: (row: DemoRecord) => row.region },
	{
		id: 'sync',
		label: '同步',
		width: '7rem',
		cell: (row: DemoRecord) => (
			<div role='switch' tabIndex={0} aria-checked='false' aria-label={`同步 ${row.name}`}>
				未启用
			</div>
		),
	},
] as const satisfies readonly DataViewColumn<DemoRecord>[];

export const Interactive: Story = {
	render: () => <ConsoleDataViewDemo />,
};

export const DenseListLayout: Story = {
	name: 'Dense List / Header Content Footer',
	render: () => <DenseListLayoutDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const header = canvasElement.querySelector<HTMLElement>('[data-slot="data-view-layout-header"]');
		await expect(within(header as HTMLElement).queryByText('6 条')).not.toBeInTheDocument();
		await expect(canvas.getByText('1-3')).toBeInTheDocument();
		await expect(canvas.getByText('总数 6')).toBeInTheDocument();
		await expect(canvas.getByRole('combobox', { name: '每页数量' })).toHaveValue('3');

		let pageInput = canvas.getByRole('textbox', { name: '页码' });
		await userEvent.clear(pageInput);
		await userEvent.type(pageInput, '2.5{Enter}');
		await expect(pageInput).toHaveValue('2');
		await expect(canvas.getByText('4-6')).toBeInTheDocument();

		pageInput = canvas.getByRole('textbox', { name: '页码' });
		await userEvent.clear(pageInput);
		await userEvent.type(pageInput, '99{Enter}');
		await expect(pageInput).toHaveValue('2');
		pageInput = canvas.getByRole('textbox', { name: '页码' });
		await userEvent.clear(pageInput);
		await userEvent.type(pageInput, '-2{Enter}');
		await expect(pageInput).toHaveValue('1');
	},
};

export const LargeDataset: Story = {
	name: 'Large Dataset / Scroll',
	render: () => <ConsoleDataViewDemo records={largeDataset} pageSize={100} />,
	parameters: {
		docs: {
			description: {
				story:
					'500 seeded Faker records with 100 rows per page for vertical, horizontal, sticky-header, and mode-switch scrolling checks.',
			},
		},
	},
};

export const ResourceWorkbench: Story = {
	name: 'Resource Workbench / Multi View Summary',
	render: () => (
		<main className='h-[min(50rem,calc(100vh-1rem))] p-2'>
			<DataViewResourceWorkspaceDemo />
		</main>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		const mobile = (canvasElement.ownerDocument.defaultView?.innerWidth ?? 1024) < 1024;
		await userEvent.click(canvas.getByRole('checkbox', { name: '选择 core-postgres' }));
		await expect(canvas.getByRole('checkbox', { name: '选择 core-postgres' })).toBeChecked();
		await userEvent.click(canvas.getByRole('row', { name: 'core-postgres' }));
		await expect(canvas.getByRole('complementary', { name: '资源概要' })).toHaveTextContent('core-postgres');
		if (mobile) {
			await expect(canvas.getByRole('dialog', { name: '概要' })).not.toHaveAttribute('aria-modal');
			await waitFor(() => expect(canvas.getByRole('button', { name: '关闭概要' })).toHaveFocus());
			await expect(canvasElement.querySelector('[data-slot="data-view-layout-background"]')).toHaveAttribute('inert');
		}
		await userEvent.click(canvas.getByRole('tab', { name: '概要' }));
		await userEvent.keyboard('{ArrowRight}');
		await expect(canvas.getByRole('tab', { name: '元数据' })).toHaveAttribute('aria-selected', 'true');
		await expect(canvas.getByText('res-001')).toBeInTheDocument();

		if (mobile) {
			await userEvent.keyboard('{Escape}');
			await expect(canvas.queryByRole('dialog', { name: '概要' })).not.toBeInTheDocument();
			await expect(canvas.getByRole('row', { name: 'core-postgres' })).toHaveFocus();

			await userEvent.click(canvas.getByRole('button', { name: '列表视图' }));
			await expect(canvas.getByRole('checkbox', { name: '选择 core-postgres' })).toBeChecked();
			await userEvent.click(canvas.getByRole('listitem', { name: 'core-postgres' }));
			await expect(canvas.getByRole('complementary', { name: '资源概要' })).toHaveTextContent('res-001');
			await userEvent.keyboard('{Escape}');

			await userEvent.click(canvas.getByRole('button', { name: '工作表视图' }));
			await expect(canvas.getByRole('checkbox', { name: '选择 core-postgres' })).toBeChecked();
		} else {
			await userEvent.click(canvas.getByRole('button', { name: '列表视图' }));
			await expect(canvas.getByRole('listitem', { name: 'core-postgres' })).toHaveAttribute('aria-current', 'true');
			await expect(canvas.getByRole('checkbox', { name: '选择 core-postgres' })).toBeChecked();
			await expect(canvas.getByRole('complementary', { name: '资源概要' })).toHaveTextContent('res-001');
			await userEvent.click(canvas.getByRole('button', { name: '工作表视图' }));
			await expect(canvas.getByRole('row', { name: 'core-postgres' })).toHaveAttribute('data-active', 'true');
			await expect(canvas.getByRole('checkbox', { name: '选择 core-postgres' })).toBeChecked();
			await userEvent.click(canvas.getByRole('button', { name: '关闭概要' }));
		}

		const sheetCheckbox = canvas.getByRole('checkbox', { name: '选择 core-postgres' });
		sheetCheckbox.focus();
		await userEvent.keyboard('{ArrowDown}');
		await expect(sheetCheckbox).toHaveFocus();
		if (!mobile) {
			const sheetRow = canvas.getByRole('row', { name: 'core-postgres' });
			sheetRow.focus();
			await userEvent.keyboard('{ArrowDown}');
			await expect(canvas.getByRole('row', { name: 'session-cache' })).toHaveFocus();
			await userEvent.keyboard('{ArrowUp}');
			await expect(sheetRow).toHaveFocus();
			await userEvent.click(canvas.getByRole('button', { name: '关闭概要' }));
		}

		await userEvent.click(canvas.getByRole('button', { name: '表格视图' }));
		await userEvent.click(canvas.getByRole('button', { name: '负责人' }));
		await userEvent.click(canvas.getByRole('button', { name: '显示列' }));
		await userEvent.click(await body.findByRole('menuitemcheckbox', { name: '负责人' }));
		await expect(canvas.queryByRole('columnheader', { name: '负责人' })).not.toBeInTheDocument();
		await expect(canvas.getByRole('combobox', { name: '排序' })).toHaveValue('source-order');

		await userEvent.click(canvas.getByRole('button', { name: '筛选' }));
		await expect(canvas.getByText('1-2')).toBeInTheDocument();
		await expect(canvas.getByText('总数 2')).toBeInTheDocument();
		await expect(canvas.queryByRole('complementary', { name: '资源概要' })).not.toBeInTheDocument();
	},
	parameters: {
		docs: {
			description: {
				story:
					'Renderer-neutral workspace with shared table/list/sheet state, controlled columns, and active-record summary.',
			},
		},
	},
};

export const LongSheetScroll: Story = {
	name: 'Sheet / Long Scroll',
	render: () => (
		<main className='h-80 p-2'>
			<DataViewLayout.Composite
				header={<DataViewLayout.Header title='资源工作表' />}
				footer={<DataViewLayout.Footer info='100 条' />}
			>
				<DataViewLayout.Sheet
					rows={largeDataset.slice(0, 100)}
					columns={sheetColumns}
					getRowId={(row) => row.id}
					onActiveIdChange={() => undefined}
				/>
			</DataViewLayout.Composite>
		</main>
	),
	play: async ({ canvasElement }) => {
		const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="data-view-layout-viewport"]');
		const sheet = canvasElement.querySelector<HTMLElement>('[data-slot="data-view-sheet"]');
		expect(viewport).not.toBeNull();
		expect(sheet).not.toBeNull();
		await expect(viewport?.scrollHeight ?? 0).toBeGreaterThan(viewport?.clientHeight ?? 0);
		await expect(getComputedStyle(viewport as HTMLElement).overflowY).toBe('auto');
		await expect(getComputedStyle(sheet as HTMLElement).overflowY).toBe('visible');
		const cellControl = within(sheet as HTMLElement).getAllByRole('switch')[0] as HTMLElement;
		cellControl.focus();
		await userEvent.keyboard('{ArrowDown}');
		await expect(cellControl).toHaveFocus();
		(viewport as HTMLElement).scrollTop = 160;
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		const viewportTop = (viewport as HTMLElement).getBoundingClientRect().top;
		const headerTop = canvasElement.querySelector('[role="columnheader"]')?.getBoundingClientRect().top ?? -1;
		await expect(headerTop).toBeGreaterThanOrEqual(viewportTop - 1);
		await expect(headerTop).toBeLessThanOrEqual(viewportTop + 1);
	},
};

export const Empty: Story = {
	render: () => (
		<main className='p-5'>
			<h1 className='sr-only'>Empty data view</h1>
			<DataView className='h-[32rem]' header={<DataViewHeader title='服务资源' description='当前筛选条件' />}>
				<DataViewEmpty
					icon={<Database className='size-6' />}
					title='没有匹配的资源'
					description='调整搜索词或清除筛选条件后重试。'
					action={
						<button type='button' className='bg-neutral text-neutral-content h-8 rounded-md px-3 text-xs font-medium'>
							清除筛选
						</button>
					}
				/>
			</DataView>
		</main>
	),
};

function DenseListLayoutDemo() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(3);
	const rows = demoRecords.slice((page - 1) * pageSize, page * pageSize);

	return (
		<main className='h-[min(42rem,calc(100vh-2rem))] p-3'>
			<DataViewLayout.Composite
				header={
					<DataViewLayout.Header
						title='客户'
						search={<DataViewSearch placeholder='搜索客户' />}
						actions={
							<button type='button' className='btn btn-neutral btn-sm'>
								<Plus className='size-4' />
								新建客户
							</button>
						}
					/>
				}
				footer={
					<DataViewLayout.ResourceFooter
						page={page}
						pageSize={pageSize}
						pageSizeOptions={[3, 6]}
						total={demoRecords.length}
						onPageChange={setPage}
						onPageSizeChange={(nextPageSize) => {
							setPageSize(nextPageSize);
							setPage(1);
						}}
					/>
				}
			>
				<DataViewLayout.Table>
					<thead className='bg-base-200 text-base-content/60 sticky top-0 text-xs'>
						<tr>
							<th className='px-3 py-2 font-medium'>名称</th>
							<th className='px-3 py-2 font-medium'>类型</th>
							<th className='px-3 py-2 font-medium'>状态</th>
							<th className='px-3 py-2 font-medium'>负责人</th>
						</tr>
					</thead>
					<tbody className='divide-base-300 divide-y'>
						{rows.map((record) => (
							<tr key={record.id} className='hover:bg-base-200/50'>
								<td className='px-3 py-2 font-medium'>{record.name}</td>
								<td className='text-base-content/65 px-3 py-2'>{record.type}</td>
								<td className='px-3 py-2'>
									<StoryResourceStatus status={record.status} />
								</td>
								<td className='text-base-content/65 px-3 py-2'>{record.owner}</td>
							</tr>
						))}
					</tbody>
				</DataViewLayout.Table>
			</DataViewLayout.Composite>
		</main>
	);
}

function StoryResourceStatus({ status }: { status: DemoRecord['status'] }) {
	const config = { healthy: ['正常', 'success'], warning: ['警告', 'warning'], offline: ['离线', 'danger'] } as const;
	return (
		<Status tone={config[status][1]} size='sm' variant='soft' dot>
			{config[status][0]}
		</Status>
	);
}
