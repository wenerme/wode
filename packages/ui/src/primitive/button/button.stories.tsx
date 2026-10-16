import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Button } from './index';

const meta = {
	title: 'Primitive/Button',
	component: Button,
	tags: ['autodocs'],
	args: { children: '保存设置', variant: 'default', size: 'md', disabled: false },
	argTypes: {
		variant: { control: 'select', options: ['default', 'secondary', 'outline', 'ghost', 'destructive'] },
		size: { control: 'select', options: ['sm', 'md', 'lg', 'icon'] },
	},
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Outline: Story = { args: { variant: 'outline', children: '取消' } };
export const Destructive: Story = { args: { variant: 'destructive', children: '删除草稿' } };
export const Small: Story = { args: { size: 'sm' } };
export const Disabled: Story = { args: { disabled: true } };
export const Interaction: Story = {
	render: function Render(args) {
		const [count, setCount] = useState(0);
		return (
			<div className='grid gap-3'>
				<Button {...args} onClick={() => setCount(count + 1)}>
					增加数量
				</Button>
				<output aria-label='数量'>{count}</output>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole('button', { name: '增加数量' }));
		await expect(canvas.getByLabelText('数量')).toHaveTextContent('1');
	},
};
