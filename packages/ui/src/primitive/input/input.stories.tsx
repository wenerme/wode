import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect } from 'storybook/test';
import { Input } from './index';

const meta = {
	title: 'Primitive/Input',
	component: Input,
	tags: ['autodocs'],
	args: { placeholder: '输入显示名称', controlSize: 'md', variant: 'default', disabled: false },
	argTypes: {
		controlSize: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
		variant: { control: 'select', options: ['default', 'ghost'] },
	},
	render: function Render(args) {
		const id = useId();
		return (
			<div className='grid max-w-sm gap-2'>
				<label htmlFor={id}>显示名称</label>
				<Input {...args} id={id} />
			</div>
		);
	},
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Ghost: Story = { args: { variant: 'ghost', defaultValue: '未命名笔记' } };
export const Large: Story = { args: { controlSize: 'lg', tone: 'primary' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: '不可编辑' } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: '只读名称' } };
export const Controlled: Story = {
	render: function Render(args) {
		const [value, setValue] = useState('');
		const id = useId();
		return (
			<div className='grid max-w-sm gap-2'>
				<label htmlFor={id}>显示名称</label>
				<Input {...args} id={id} value={value} onChange={(event) => setValue(event.currentTarget.value)} />
				<output aria-label='当前名称'>{value || '尚未填写'}</output>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		const input = canvas.getByRole('textbox', { name: '显示名称' });
		await userEvent.clear(input);
		await userEvent.type(input, '春日笔记');
		await expect(input).toHaveValue('春日笔记');
		await expect(canvas.getByLabelText('当前名称')).toHaveTextContent('春日笔记');
	},
};
