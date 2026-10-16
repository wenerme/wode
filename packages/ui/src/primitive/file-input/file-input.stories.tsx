import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect } from 'storybook/test';
import { FileInput } from './index';

const meta = {
	title: 'Primitive/File Input',
	component: FileInput,
	tags: ['autodocs'],
	args: { controlSize: 'md', disabled: false, accept: '.txt,text/plain' },
	argTypes: { controlSize: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] } },
	render: function Render(args) {
		const id = useId();
		const [names, setNames] = useState<string[]>([]);
		return (
			<div className='grid max-w-md gap-2'>
				<label htmlFor={id}>选择文本文件</label>
				<FileInput
					{...args}
					id={id}
					onChange={(event) => setNames(Array.from(event.currentTarget.files ?? [], (file) => file.name))}
				/>
				<output aria-label='已选文件'>{names.length ? names.join('、') : '尚未选择文件'}</output>
			</div>
		);
	},
} satisfies Meta<typeof FileInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SmallGhost: Story = { args: { controlSize: 'sm', variant: 'ghost' } };
export const Disabled: Story = { args: { disabled: true } };
export const LocalUpload: Story = {
	play: async ({ canvas, userEvent }) => {
		const input = canvas.getByLabelText('选择文本文件') as HTMLInputElement;
		const file = new File(['今天的阅读笔记'], 'notes.txt', { type: 'text/plain' });
		await userEvent.upload(input, file);
		await expect(input.files).toHaveLength(1);
		await expect(input.files?.[0]).toBe(file);
		await expect(canvas.getByLabelText('已选文件')).toHaveTextContent('notes.txt');
	},
};
export const MultipleFiles: Story = {
	args: { multiple: true, tone: 'primary' },
	play: async ({ canvas, userEvent }) => {
		const input = canvas.getByLabelText('选择文本文件') as HTMLInputElement;
		await userEvent.upload(input, [
			new File(['一'], 'first.txt', { type: 'text/plain' }),
			new File(['二'], 'second.txt', { type: 'text/plain' }),
		]);
		await expect(input.files).toHaveLength(2);
		await expect(canvas.getByLabelText('已选文件')).toHaveTextContent('first.txt、second.txt');
	},
};
