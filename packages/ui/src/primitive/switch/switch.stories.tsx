import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect } from 'storybook/test';
import { Switch } from './index';

const meta = {
	title: 'Primitive/Switch',
	component: Switch,
	tags: ['autodocs'],
	args: { size: 'md', tone: 'primary', disabled: false },
	argTypes: { size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] } },
	render: function Render(args) {
		const id = useId();
		return (
			<div className='flex items-center gap-3'>
				<Switch {...args} id={id} />
				<label htmlFor={id}>自动保存</label>
			</div>
		);
	},
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Enabled: Story = { args: { defaultChecked: true, size: 'lg', tone: 'success' } };
export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };
export const Controlled: Story = {
	render: function Render(args) {
		const [checked, setChecked] = useState(false);
		const id = useId();
		return (
			<div className='grid gap-3'>
				<div className='flex items-center gap-3'>
					<Switch {...args} id={id} checked={checked} onCheckedChange={setChecked} />
					<label htmlFor={id}>自动保存</label>
				</div>
				<output aria-label='保存模式'>{checked ? '自动保存已开启' : '手动保存'}</output>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		const control = canvas.getByRole('switch', { name: '自动保存' });
		await userEvent.click(control);
		await expect(control).toBeChecked();
		await expect(canvas.getByLabelText('保存模式')).toHaveTextContent('自动保存已开启');
		await userEvent.keyboard(' ');
		await expect(control).not.toBeChecked();
	},
};
