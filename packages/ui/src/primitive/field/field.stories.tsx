import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor } from 'storybook/test';
import { Input } from '../input';
import { Field, FieldControl, FieldDescription, FieldError, FieldLabel } from './index';

const meta = {
	title: 'Primitive/Field',
	component: Field,
	tags: ['autodocs'],
	args: { disabled: false, className: 'max-w-sm' },
	render: (args) => (
		<Field {...args}>
			<FieldLabel>笔记标题</FieldLabel>
			<FieldControl render={<Input />} placeholder='输入标题' />
			<FieldDescription>用简短文字概括内容。</FieldDescription>
		</Field>
	),
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Invalid: Story = {
	args: { invalid: true },
	render: (args) => (
		<Field {...args}>
			<FieldLabel>笔记标题</FieldLabel>
			<FieldControl render={<Input />} required />
			<FieldDescription>标题不能为空。</FieldDescription>
			<FieldError match>请输入笔记标题。</FieldError>
		</Field>
	),
};
export const Controlled: Story = {
	render: function Render(args) {
		const [value, setValue] = useState('');
		return (
			<div className='grid gap-3'>
				<Field {...args}>
					<FieldLabel>笔记标题</FieldLabel>
					<FieldControl render={<Input />} value={value} onValueChange={setValue} />
					<FieldDescription>用简短文字概括内容。</FieldDescription>
				</Field>
				<output aria-label='标题预览'>{value || '尚未填写'}</output>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		const input = canvas.getByRole('textbox', { name: '笔记标题' });
		await expect(input).toHaveAccessibleDescription('用简短文字概括内容。');
		await userEvent.clear(input);
		await userEvent.type(input, '阅读清单');
		await expect(input).toHaveValue('阅读清单');
		await expect(canvas.getByLabelText('标题预览')).toHaveTextContent('阅读清单');
	},
};
export const ValidateOnBlur: Story = {
	args: { validationMode: 'onBlur' },
	render: (args) => (
		<Field {...args}>
			<FieldLabel>笔记标题</FieldLabel>
			<FieldControl render={<Input />} required />
			<FieldDescription>填写后按 Tab 离开字段。</FieldDescription>
			<FieldError match='valueMissing'>请输入笔记标题。</FieldError>
		</Field>
	),
	play: async ({ canvas, userEvent }) => {
		const input = canvas.getByRole('textbox', { name: '笔记标题' });
		await userEvent.type(input, '临时标题');
		await userEvent.clear(input);
		await userEvent.tab();
		await expect(await canvas.findByText('请输入笔记标题。')).toBeVisible();
		await expect(input).toBeInvalid();
		await expect(input).toHaveAttribute('aria-invalid', 'true');
		await userEvent.type(input, '旅行随笔');
		await userEvent.tab();
		await expect(input).toBeValid();
		await waitFor(() => expect(canvas.queryByText('请输入笔记标题。')).not.toBeInTheDocument());
	},
};
