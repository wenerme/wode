import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect } from 'storybook/test';
import { Radio } from './index';

const meta = {
	title: 'Primitive/Radio',
	component: Radio,
	tags: ['autodocs'],
	args: { controlSize: 'md', tone: 'primary', disabled: false },
	argTypes: { controlSize: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] } },
	render: function Render(args) {
		const name = useId();
		return (
			<fieldset className='grid gap-3'>
				<legend>阅读布局</legend>
				<label className='flex items-center gap-2'>
					<Radio {...args} name={name} value='list' />
					列表
				</label>
				<label className='flex items-center gap-2'>
					<Radio {...args} name={name} value='grid' />
					网格
				</label>
			</fieldset>
		);
	},
} satisfies Meta<typeof Radio>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Large: Story = { args: { controlSize: 'lg', tone: 'secondary' } };
export const Disabled: Story = { args: { disabled: true } };
export const Controlled: Story = {
	render: function Render(args) {
		const name = useId();
		const [value, setValue] = useState('list');
		return (
			<fieldset className='grid gap-3'>
				<legend>阅读布局</legend>
				{[
					{ value: 'list', label: '列表' },
					{ value: 'grid', label: '网格' },
				].map((option) => (
					<label key={option.value} className='flex items-center gap-2'>
						<Radio
							{...args}
							name={name}
							value={option.value}
							checked={value === option.value}
							onChange={(event) => setValue(event.currentTarget.value)}
						/>
						{option.label}
					</label>
				))}
				<output aria-label='当前布局'>{value === 'list' ? '列表布局' : '网格布局'}</output>
			</fieldset>
		);
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole('radio', { name: '网格' }));
		await expect(canvas.getByRole('radio', { name: '网格' })).toBeChecked();
		await expect(canvas.getByRole('radio', { name: '列表' })).not.toBeChecked();
		await expect(canvas.getByLabelText('当前布局')).toHaveTextContent('网格布局');
	},
};
