import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect } from 'storybook/test';
import { Button } from '../button';
import { Range } from './index';

const meta = {
	title: 'Primitive/Range',
	component: Range,
	tags: ['autodocs'],
	args: { min: 50, max: 200, step: 10, controlSize: 'md', tone: 'primary', disabled: false },
	argTypes: { controlSize: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] } },
	render: function Render(args) {
		const id = useId();
		const [value, setValue] = useState(100);
		return (
			<div className='grid w-72 gap-3'>
				<label htmlFor={id}>页面缩放</label>
				<Range {...args} id={id} value={value} onChange={(event) => setValue(event.currentTarget.valueAsNumber)} />
				<output htmlFor={id} aria-label='缩放比例'>
					{value}%
				</output>
			</div>
		);
	},
} satisfies Meta<typeof Range>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Large: Story = { args: { controlSize: 'lg', tone: 'secondary' } };
export const Disabled: Story = { args: { disabled: true } };
export const StepControls: Story = {
	args: { min: 50, max: 80, step: 10 },
	parameters: {
		docs: { description: { story: '通过增减按钮按步长调整受控缩放值，并限制上下界。此用例不验证原生滑条键盘行为。' } },
	},
	render: function Render(args) {
		const id = useId();
		const min = Number(args.min ?? 50);
		const max = Number(args.max ?? 80);
		const step = Number(args.step ?? 10);
		const [value, setValue] = useState(min);
		return (
			<div className='grid w-72 gap-3'>
				<label htmlFor={id}>页面缩放</label>
				<Range
					{...args}
					id={id}
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={(event) => setValue(event.currentTarget.valueAsNumber)}
				/>
				<div className='flex gap-2'>
					<Button
						variant='outline'
						aria-controls={id}
						disabled={args.disabled || value <= min}
						onClick={() => setValue((current) => Math.max(min, current - step))}
					>
						减小缩放
					</Button>
					<Button
						variant='outline'
						aria-controls={id}
						disabled={args.disabled || value >= max}
						onClick={() => setValue((current) => Math.min(max, current + step))}
					>
						增大缩放
					</Button>
				</div>
				<output htmlFor={id} aria-label='缩放比例'>
					{value}%
				</output>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		const range = canvas.getByRole('slider', { name: '页面缩放' });
		const decrease = canvas.getByRole('button', { name: '减小缩放' });
		const increase = canvas.getByRole('button', { name: '增大缩放' });
		await expect(range).toHaveAttribute('min', '50');
		await expect(range).toHaveAttribute('max', '80');
		await expect(range).toHaveAttribute('step', '10');
		await expect(decrease).toBeDisabled();
		await userEvent.click(increase);
		await expect(range).toHaveValue('60');
		await expect(canvas.getByLabelText('缩放比例')).toHaveTextContent('60%');
		await userEvent.click(increase);
		await userEvent.click(increase);
		await expect(range).toHaveValue('80');
		await expect(canvas.getByLabelText('缩放比例')).toHaveTextContent('80%');
		await expect(increase).toBeDisabled();
		await userEvent.click(decrease);
		await expect(range).toHaveValue('70');
		await userEvent.click(decrease);
		await userEvent.click(decrease);
		await expect(range).toHaveValue('50');
		await expect(canvas.getByLabelText('缩放比例')).toHaveTextContent('50%');
		await expect(decrease).toBeDisabled();
	},
};
