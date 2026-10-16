import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Otp } from './index';

const meta = {
	title: 'Primitive/OTP',
	component: Otp,
	tags: ['autodocs'],
	args: { length: 6, size: 'md', tone: 'neutral', joined: false, disabled: false, 'aria-label': '一次性验证码' },
	argTypes: {
		length: { control: { type: 'number', min: 1, max: 8 } },
		size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
	},
} satisfies Meta<typeof Otp>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const JoinedFourDigits: Story = { args: { length: 4, joined: true, size: 'lg', tone: 'primary' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: '123456' } };
export const Controlled: Story = {
	render: function Render(args) {
		const [value, setValue] = useState('');
		return (
			<div className='grid gap-3'>
				<p>输入六位数字，超出长度的内容不会保留。</p>
				<Otp {...args} value={value} onValueChange={setValue} />
				<output aria-label='已输入位数'>
					{value.length} / {args.length}
				</output>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		const input = canvas.getByRole('textbox', { name: '一次性验证码' });
		input.focus();
		await expect(input).toHaveFocus();
		await userEvent.clear(input);
		await userEvent.keyboard('1234567');
		await expect(input).toHaveValue('123456');
		await expect(input).toBeValid();
		await expect(canvas.getByLabelText('已输入位数')).toHaveTextContent('6 / 6');
	},
};
export const PatternValidation: Story = {
	parameters: { docs: { description: { story: '组件使用原生 pattern 校验数字格式，输入过程不会过滤字母。' } } },
	play: async ({ canvas, userEvent }) => {
		const input = canvas.getByRole('textbox', { name: '一次性验证码' });
		input.focus();
		await expect(input).toHaveFocus();
		await userEvent.clear(input);
		await userEvent.keyboard('12ab56');
		await expect(input).toHaveValue('12ab56');
		await expect(input).toBeInvalid();
		await userEvent.clear(input);
		await userEvent.keyboard('654321');
		await expect(input).toHaveValue('654321');
		await expect(input).toBeValid();
	},
};
