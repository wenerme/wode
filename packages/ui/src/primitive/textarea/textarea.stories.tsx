import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect } from 'storybook/test';
import { Textarea } from './index';

const meta = {
	title: 'Primitive/Textarea',
	component: Textarea,
	tags: ['autodocs'],
	args: { placeholder: '写下你的想法', size: 'md', disabled: false, rows: 4 },
	argTypes: { size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] } },
	render: function Render(args) {
		const id = useId();
		return (
			<div className='grid max-w-md gap-2'>
				<label htmlFor={id}>备注</label>
				<Textarea {...args} id={id} />
			</div>
		);
	},
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Ghost: Story = { args: { variant: 'ghost', size: 'lg' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: '已归档的备注' } };
export const CharacterLimit: Story = {
	args: { maxLength: 80 },
	render: function Render(args) {
		const id = useId();
		const [text, setText] = useState('');
		return (
			<div className='grid max-w-md gap-2'>
				<label htmlFor={id}>备注</label>
				<Textarea
					{...args}
					id={id}
					value={text}
					onChange={(event) => setText(event.currentTarget.value)}
					aria-describedby={`${id}-count`}
				/>
				<output id={`${id}-count`} aria-label='字数'>
					{text.length} / {args.maxLength}
				</output>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		const input = canvas.getByRole('textbox', { name: '备注' });
		await userEvent.clear(input);
		await userEvent.type(input, '第一行{Enter}第二行');
		await expect(input).toHaveValue('第一行\n第二行');
		await expect(canvas.getByLabelText('字数')).toHaveTextContent('7 / 80');
	},
};
