import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect } from 'storybook/test';
import { Button } from '../button';
import { Slider } from './index';

const meta = {
	title: 'Primitive/Slider',
	component: Slider,
	tags: ['autodocs'],
	args: { min: 0, max: 100, step: 5, size: 'md', tone: 'primary', disabled: false },
	argTypes: { size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] } },
	render: function Render(args) {
		const id = useId();
		const [value, setValue] = useState(40);
		return (
			<div className='grid w-72 gap-3'>
				<label htmlFor={id}>音量</label>
				<Slider {...args} id={id} value={value} onChange={(event) => setValue(event.currentTarget.valueAsNumber)} />
				<output htmlFor={id} aria-label='当前音量'>
					{value}%
				</output>
			</div>
		);
	},
} satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm', tone: 'secondary' } };
export const Disabled: Story = { args: { disabled: true } };
export const StepControls: Story = {
	args: { min: 0, max: 15, step: 5 },
	parameters: {
		docs: { description: { story: '通过增减按钮按步长调整受控音量，并限制上下界。此用例不验证原生滑条键盘行为。' } },
	},
	render: function Render(args) {
		const id = useId();
		const min = Number(args.min ?? 0);
		const max = Number(args.max ?? 15);
		const step = Number(args.step ?? 5);
		const [value, setValue] = useState(min);
		return (
			<div className='grid w-72 gap-3'>
				<label htmlFor={id}>音量</label>
				<Slider
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
						减小音量
					</Button>
					<Button
						variant='outline'
						aria-controls={id}
						disabled={args.disabled || value >= max}
						onClick={() => setValue((current) => Math.min(max, current + step))}
					>
						增大音量
					</Button>
				</div>
				<output htmlFor={id} aria-label='当前音量'>
					{value}%
				</output>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		const slider = canvas.getByRole('slider', { name: '音量' });
		const decrease = canvas.getByRole('button', { name: '减小音量' });
		const increase = canvas.getByRole('button', { name: '增大音量' });
		await expect(slider).toHaveAttribute('min', '0');
		await expect(slider).toHaveAttribute('max', '15');
		await expect(slider).toHaveAttribute('step', '5');
		await expect(decrease).toBeDisabled();
		await userEvent.click(increase);
		await expect(slider).toHaveValue('5');
		await expect(canvas.getByLabelText('当前音量')).toHaveTextContent('5%');
		await userEvent.click(increase);
		await expect(slider).toHaveValue('10');
		await userEvent.click(increase);
		await expect(slider).toHaveValue('15');
		await expect(canvas.getByLabelText('当前音量')).toHaveTextContent('15%');
		await expect(increase).toBeDisabled();
		await userEvent.click(decrease);
		await expect(slider).toHaveValue('10');
		await userEvent.click(decrease);
		await userEvent.click(decrease);
		await expect(slider).toHaveValue('0');
		await expect(canvas.getByLabelText('当前音量')).toHaveTextContent('0%');
		await expect(decrease).toBeDisabled();
	},
};
