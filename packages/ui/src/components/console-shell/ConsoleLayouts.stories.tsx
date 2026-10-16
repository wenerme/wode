import type { Meta, StoryObj } from '@storybook/react-vite';
import { Files, Folder } from 'lucide-react';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { ConsoleMainHeader, ConsoleMainLayout } from './ConsoleMainLayout';
import { ConsoleModuleLayout, ConsoleModuleLink, ConsoleModuleTitle } from './ConsoleModuleLayout';
import { ConsoleShellLayout } from './ConsoleShellLayout';

const meta = {
	title: 'Console/Layouts',
	component: ConsoleShellLayout,
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ConsoleShellLayout>;
export default meta;
type Story = StoryObj<typeof meta>;

function LayoutExample({ controlled = false }: { controlled?: boolean }) {
	const [collapsed, setCollapsed] = useState(false);
	const [page, setPage] = useState('全部文档');
	return (
		<div className='h-[560px]'>
			<ConsoleShellLayout>
				<ConsoleModuleLayout
					brand={{ label: '文档空间', icon: <Folder aria-hidden />, detail: '个人工作区' }}
					{...(controlled ? { collapsed, onCollapsedChange: setCollapsed } : {})}
					footer={<span className='sr-only'>本地工作区</span>}
				>
					<ConsoleModuleTitle>内容</ConsoleModuleTitle>
					{['全部文档', '已归档'].map((label) => (
						<ConsoleModuleLink
							key={label}
							href={`#${label}`}
							label={label}
							icon={<Files aria-hidden />}
							active={page === label}
							onClick={(event) => {
								event.preventDefault();
								setPage(label);
							}}
						/>
					))}
				</ConsoleModuleLayout>
				<ConsoleMainLayout
					header={
						<ConsoleMainHeader
							title={page}
							breadcrumbs='文档空间 / 内容'
							actions={
								controlled ? (
									<button className='btn btn-sm' type='button' onClick={() => setCollapsed(!collapsed)}>
										宿主切换导航
									</button>
								) : undefined
							}
						/>
					}
				>
					<section className='p-6'>
						<h1 className='text-lg font-semibold'>{page}</h1>
						<p>侧栏折叠后仍可通过图标导航，悬停可查看标题。</p>
					</section>
				</ConsoleMainLayout>
			</ConsoleShellLayout>
		</div>
	);
}
export const Uncontrolled: Story = { render: () => <LayoutExample /> };
export const Controlled: Story = {
	render: () => <LayoutExample controlled />,
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole('button', { name: '宿主切换导航' }));
		const toggle = canvas.queryByRole('button', { name: '展开模块导航' });
		if (toggle) {
			await expect(toggle).toHaveAttribute('aria-expanded', 'false');
			await userEvent.click(toggle);
			await expect(canvas.getByRole('button', { name: '收起模块导航' })).toHaveAttribute('aria-expanded', 'true');
			await userEvent.click(canvas.getByRole('link', { name: '已归档' }));
			await expect(canvas.getByRole('heading', { name: '已归档' })).toBeVisible();
		}
	},
};
