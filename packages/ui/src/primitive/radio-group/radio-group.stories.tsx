import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect } from 'storybook/test';
import { RadioGroup, RadioGroupItem } from './index';

const meta = {
	title: 'Primitive/Radio Group',
	component: RadioGroup,
	tags: ['autodocs'],
	args: { disabled: false, defaultValue: 'comfortable' },
	render: function Render(args) {
		const id = useId();
		return (
			<div className='grid gap-3'>
				<span id={id}>内容密度</span>
				<RadioGroup {...args} aria-labelledby={id}>
					<label className='flex items-center gap-2'>
						<RadioGroupItem value='comfortable' />
						舒适
					</label>
					<label className='flex items-center gap-2'>
						<RadioGroupItem value='compact' />
						紧凑
					</label>
					<label className='flex items-center gap-2'>
						<RadioGroupItem value='automatic' disabled />
						自动（暂不可用）
					</label>
				</RadioGroup>
			</div>
		);
	},
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const ItemSizes: Story = {
	render: function Render(args) {
		const id = useId();
		return (
			<div className='grid gap-3'>
				<span id={id}>选择控件尺寸</span>
				<RadioGroup {...args} defaultValue='md' aria-labelledby={id}>
					{(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
						<label key={size} className='flex items-center gap-2'>
							<RadioGroupItem value={size} size={size} tone='secondary' />
							{size}
						</label>
					))}
				</RadioGroup>
			</div>
		);
	},
};
export const Controlled: Story = {
	render: function Render(args) {
		const [value, setValue] = useState<unknown>('comfortable');
		const id = useId();
		return (
			<div className='grid gap-3'>
				<span id={id}>内容密度</span>
				<RadioGroup {...args} value={value} onValueChange={setValue} aria-labelledby={id}>
					<label className='flex items-center gap-2'>
						<RadioGroupItem value='comfortable' />
						舒适
					</label>
					<label className='flex items-center gap-2'>
						<RadioGroupItem value='compact' />
						紧凑
					</label>
				</RadioGroup>
				<output aria-label='密度状态'>{value === 'compact' ? '紧凑布局' : '舒适布局'}</output>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole('radio', { name: '紧凑' }));
		await expect(canvas.getByRole('radio', { name: '紧凑' })).toBeChecked();
		await expect(canvas.getByRole('radio', { name: '舒适' })).not.toBeChecked();
		await expect(canvas.getByLabelText('密度状态')).toHaveTextContent('紧凑布局');
	},
};
