import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Menu, MenuItem, MenuTitle } from './index';

function MenuExample({ horizontal = false }: { horizontal?: boolean }) {
	const [selected, setSelected] = useState('收件箱');
	return (
		<div className='grid gap-4'>
			<nav aria-label='文件分类'>
				<Menu
					orientation={horizontal ? 'horizontal' : 'vertical'}
					size={horizontal ? 'sm' : 'md'}
					className='bg-base-200 rounded-box'
				>
					{!horizontal && <MenuTitle>工作空间</MenuTitle>}
					{['收件箱', '已归档'].map((label) => (
						<MenuItem key={label} active={selected === label}>
							<button type='button' aria-pressed={selected === label} onClick={() => setSelected(label)}>
								{label}
							</button>
						</MenuItem>
					))}
					<MenuItem disabled>
						<button type='button' disabled>
							回收站（不可用）
						</button>
					</MenuItem>
				</Menu>
			</nav>
			<p role='status'>当前分类：{selected}</p>
		</div>
	);
}
const meta = { title: 'Primitive/Menu', component: Menu, tags: ['autodocs'] } satisfies Meta<typeof Menu>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => <MenuExample />,
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole('button', { name: '已归档' }));
		await expect(canvas.getByRole('status')).toHaveTextContent('当前分类：已归档');
		await expect(canvas.getByRole('button', { name: '回收站（不可用）' })).toBeDisabled();
	},
};
export const Horizontal: Story = { render: () => <MenuExample horizontal /> };
