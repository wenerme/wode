import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId } from 'react';
import { expect } from 'storybook/test';
import { Input } from '../input';
import { Toggle } from '../toggle';
import { FloatingLabel, Label } from './index';

const meta = {
	title: 'Primitive/Label',
	component: Label,
	tags: ['autodocs'],
	args: { children: '显示名称' },
	render: function Render(args) {
		const id = useId();
		return (
			<div className='grid max-w-sm gap-2'>
				<Label {...args} htmlFor={id} />
				<Input id={id} placeholder='输入名称' />
			</div>
		);
	},
} satisfies Meta<typeof Label>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ClickToFocus: Story = {
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByText('显示名称'));
		await expect(canvas.getByRole('textbox', { name: '显示名称' })).toHaveFocus();
	},
};
export const WrappingControl: Story = {
	args: { children: '显示阅读进度' },
	render: (args) => (
		<Label {...args} className='gap-3'>
			<Toggle />
			{args.children}
		</Label>
	),
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByText('显示阅读进度'));
		await expect(canvas.getByRole('checkbox', { name: '显示阅读进度' })).toBeChecked();
	},
};
export const Floating: Story = {
	render: function Render() {
		const id = useId();
		return (
			<FloatingLabel htmlFor={id} className='w-72'>
				<Input id={id} placeholder='显示名称' />
				<span>显示名称</span>
			</FloatingLabel>
		);
	},
	play: async ({ canvas, userEvent }) => {
		const input = canvas.getByRole('textbox', { name: '显示名称' });
		await userEvent.type(input, '晨间阅读');
		await expect(input).toHaveValue('晨间阅读');
	},
};
