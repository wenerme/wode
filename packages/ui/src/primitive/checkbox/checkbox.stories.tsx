import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect } from 'storybook/test';
import { Checkbox } from './index';

const meta = {
	title: 'Primitive/Checkbox',
	component: Checkbox,
	tags: ['autodocs'],
	args: { size: 'md', tone: 'primary', disabled: false },
	argTypes: { size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] } },
	render: function Render(args) {
		const id = useId();
		return (
			<div className='flex items-center gap-2'>
				<Checkbox {...args} id={id} />
				<label htmlFor={id}>记住显示偏好</label>
			</div>
		);
	},
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true, size: 'lg', tone: 'success' } };
export const Indeterminate: Story = { args: { indeterminate: true } };
export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };
export const Controlled: Story = {
	render: function Render(args) {
		const [checked, setChecked] = useState(false);
		const id = useId();
		return (
			<div className='grid gap-3'>
				<div className='flex items-center gap-2'>
					<Checkbox {...args} id={id} checked={checked} onCheckedChange={setChecked} />
					<label htmlFor={id}>记住显示偏好</label>
				</div>
				<output aria-label='偏好状态'>{checked ? '已记住' : '未记住'}</output>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		const checkbox = canvas.getByRole('checkbox', { name: '记住显示偏好' });
		await userEvent.click(checkbox);
		await expect(checkbox).toBeChecked();
		await expect(canvas.getByLabelText('偏好状态')).toHaveTextContent('已记住');
		await userEvent.click(checkbox);
		await expect(checkbox).not.toBeChecked();
	},
};
