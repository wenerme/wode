import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor } from 'storybook/test';
import { DataViewLayout } from './DataViewLayout';

const meta = {
	title: 'Console/Data View',
	component: DataViewLayout.Root,
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DataViewLayout.Root>;
export default meta;
type Story = StoryObj<typeof meta>;
const documents = ['设计说明', '使用指南', '发布记录'];

function DataViewExample({ filters = false, narrow = false }: { filters?: boolean; narrow?: boolean }) {
	const [selected, setSelected] = useState<string | null>(null);
	const [query, setQuery] = useState('');
	const [showFilters, setShowFilters] = useState(filters);
	const matches = documents.filter((name) => name.includes(query));
	return (
		<div className={narrow ? 'h-[800px] w-[360px] max-w-full' : 'h-[640px] w-full'}>
			<DataViewLayout.Root
				header={
					<DataViewLayout.Header
						title={<h1 className='font-semibold'>文档目录</h1>}
						search={
							<input
								className='input input-sm w-40'
								aria-label='搜索文档'
								placeholder='搜索文档'
								value={query}
								onChange={(event) => setQuery(event.target.value)}
							/>
						}
						actions={
							<button
								type='button'
								className='btn btn-sm'
								aria-pressed={showFilters}
								onClick={() => setShowFilters(!showFilters)}
							>
								筛选面板
							</button>
						}
					/>
				}
				leftPanel={
					showFilters ? (
						<aside className='h-full p-4' aria-label='筛选条件'>
							<h2 className='font-semibold'>筛选</h2>
							<p className='mt-3 text-sm'>全部本地文档</p>
						</aside>
					) : undefined
				}
				rightPanel={
					selected ? (
						<aside className='h-full space-y-4 overflow-auto p-4' aria-label='文档详情'>
							<h2 className='font-semibold'>{selected}</h2>
							<p className='text-sm'>本地示例文档，选择后显示详情。</p>
							<button type='button' className='btn btn-sm' onClick={() => setSelected(null)}>
								关闭详情
							</button>
						</aside>
					) : undefined
				}
				footer={<DataViewLayout.Footer pageInfo={`共 ${matches.length} 篇文档`} status='所有更改仅保存在本地状态' />}
			>
				<DataViewLayout.Body className='overflow-auto p-4'>
					<label className='mb-4 block text-sm'>
						工作笔记
						<input
							className='input mt-1 w-full'
							aria-label='工作笔记'
							defaultValue=''
							placeholder='切换详情时保留输入'
						/>
					</label>
					<ul className='space-y-2'>
						{matches.map((name) => (
							<li key={name}>
								<button
									type='button'
									className='btn btn-ghost w-full justify-start'
									aria-pressed={name === selected}
									onClick={() => setSelected(name)}
								>
									{name}
								</button>
							</li>
						))}
					</ul>
					{matches.length === 0 ? <p role='status'>没有匹配的文档</p> : null}
				</DataViewLayout.Body>
			</DataViewLayout.Root>
		</div>
	);
}
export const MasterDetail: Story = {
	render: () => <DataViewExample />,
	play: async ({ canvas, userEvent }) => {
		const notes = canvas.getByRole('textbox', { name: '工作笔记' });
		await userEvent.type(notes, '保留这条笔记');
		await userEvent.click(canvas.getByRole('button', { name: '设计说明' }));
		await expect(canvas.getByRole('complementary', { name: '文档详情' })).toBeVisible();
		const separator = canvas.getByRole('separator', { name: '调整右侧面板大小' });
		await expect(separator).toBeInTheDocument();
		const size = separator.getAttribute('aria-valuenow');
		separator.focus();
		await userEvent.keyboard(separator.getAttribute('aria-orientation') === 'vertical' ? '{ArrowLeft}' : '{ArrowUp}');
		await waitFor(() => expect(separator.getAttribute('aria-valuenow')).not.toBe(size));
		await userEvent.click(canvas.getByRole('button', { name: '关闭详情' }));
		await expect(canvas.queryByRole('complementary', { name: '文档详情' })).not.toBeInTheDocument();
		await expect(notes).toHaveValue('保留这条笔记');
		await userEvent.click(canvas.getByRole('button', { name: '筛选面板' }));
		await expect(canvas.getByRole('complementary', { name: '筛选条件' })).toBeVisible();
		await userEvent.type(canvas.getByRole('textbox', { name: '搜索文档' }), '不存在');
		await expect(canvas.getByRole('status')).toHaveTextContent('没有匹配的文档');
	},
};
export const WithFilters: Story = { render: () => <DataViewExample filters /> };
export const NarrowContainer: Story = { render: () => <DataViewExample narrow />, play: MasterDetail.play };
export const Dark: Story = { render: () => <DataViewExample filters />, globals: { theme: 'dark' } };
