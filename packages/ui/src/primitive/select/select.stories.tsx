import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect, screen } from 'storybook/test';
import { Select, SelectTrigger } from './index';

const options = [
	{ value: 'recent', label: '最近更新' },
	{ value: 'title', label: '标题顺序' },
	{ value: 'popular', label: '热门优先' },
];

const meta = {
	title: 'Primitive/Select',
	component: SelectTrigger,
	tags: ['autodocs'],
	args: { size: 'md', variant: 'default', disabled: false },
	argTypes: {
		size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
		variant: { control: 'select', options: ['default', 'ghost'] },
	},
	render: function Render(args) {
		const id = useId();
		const [value, setValue] = useState<string | null>('recent');
		return (
			<div className='grid w-64 gap-3'>
				<label id={`${id}-label`} htmlFor={id}>
					排序方式
				</label>
				<Select.Root items={options} value={value} onValueChange={setValue} disabled={args.disabled}>
					<Select.Trigger {...args} id={id} aria-labelledby={`${id}-label`}>
						<Select.Value />
					</Select.Trigger>
					<Select.Content>
						<Select.List>
							{options.map((option) => (
								<Select.Item key={option.value} value={option.value} disabled={option.value === 'popular'}>
									<Select.ItemText>{option.label}</Select.ItemText>
								</Select.Item>
							))}
						</Select.List>
					</Select.Content>
				</Select.Root>
				<output aria-label='当前排序'>{options.find((option) => option.value === value)?.label}</output>
			</div>
		);
	},
} satisfies Meta<typeof SelectTrigger>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LargeGhost: Story = { args: { size: 'lg', variant: 'ghost', tone: 'primary' } };
export const Disabled: Story = { args: { disabled: true } };
export const ChooseOption: Story = {
	play: async ({ canvas, userEvent }) => {
		const trigger = canvas.getByRole('combobox', { name: '排序方式' });
		await userEvent.click(trigger);
		await expect(await screen.findByRole('option', { name: '热门优先' })).toHaveAttribute('aria-disabled', 'true');
		await userEvent.click(await screen.findByRole('option', { name: '标题顺序' }));
		await expect(trigger).toHaveTextContent('标题顺序');
		await expect(canvas.getByLabelText('当前排序')).toHaveTextContent('标题顺序');
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	},
};
