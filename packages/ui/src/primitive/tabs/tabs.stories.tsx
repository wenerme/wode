import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from './index';

function TabsExample({ variant = 'box' }: { variant?: 'box' | 'border' | 'lift' }) {
	const [value, setValue] = useState<string | number | null>('overview');
	return (
		<TabsRoot value={value} onValueChange={setValue} className='w-80'>
			<TabsList variant={variant} aria-label='资料视图'>
				<TabsTrigger value='overview'>概览</TabsTrigger>
				<TabsTrigger value='details'>明细</TabsTrigger>
				<TabsTrigger value='history' disabled>
					历史（不可用）
				</TabsTrigger>
			</TabsList>
			<TabsContent value='overview' className='p-4'>
				共有 12 条记录。
			</TabsContent>
			<TabsContent value='details' className='p-4'>
				明细包含名称、类型和大小。
			</TabsContent>
		</TabsRoot>
	);
}
const meta = { title: 'Primitive/Tabs', component: TabsRoot, tags: ['autodocs'] } satisfies Meta<typeof TabsRoot>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => <TabsExample />,
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole('tab', { name: '明细' }));
		await expect(canvas.getByRole('tab', { name: '明细' })).toHaveAttribute('aria-selected', 'true');
		await expect(await canvas.findByRole('tabpanel', { name: '明细' })).toHaveTextContent('明细包含名称、类型和大小。');
		await userEvent.keyboard('{ArrowLeft}');
		await userEvent.keyboard('{Enter}');
		await expect(canvas.getByRole('tab', { name: '概览' })).toHaveAttribute('aria-selected', 'true');
	},
};
export const Border: Story = { render: () => <TabsExample variant='border' /> };
export const Lift: Story = { render: () => <TabsExample variant='lift' /> };
