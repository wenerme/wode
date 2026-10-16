import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Toggle } from './index';

const meta = {
	title: 'Primitive/Toggle',
	component: Toggle,
	tags: ['autodocs'],
	args: { controlSize: 'md', tone: 'primary', disabled: false },
	argTypes: { controlSize: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] } },
	render: (args) => (
		<label className='flex items-center gap-3'>
			<Toggle {...args} />
			显示阅读进度
		</label>
	),
} satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true, controlSize: 'lg', tone: 'secondary' } };
export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };
export const Controlled: Story = {
	render: function Render(args) {
		const [checked, setChecked] = useState(false);
		return (
			<div className='grid gap-3'>
				<label className='flex items-center gap-3'>
					<Toggle {...args} checked={checked} onChange={(event) => setChecked(event.currentTarget.checked)} />
					显示阅读进度
				</label>
				<output aria-label='进度显示状态'>{checked ? '显示进度' : '隐藏进度'}</output>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		const control = canvas.getByRole('checkbox', { name: '显示阅读进度' });
		await userEvent.click(control);
		await expect(control).toBeChecked();
		await expect(canvas.getByLabelText('进度显示状态')).toHaveTextContent('显示进度');
	},
};
