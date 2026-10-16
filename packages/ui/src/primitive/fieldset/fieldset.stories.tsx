import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Field, FieldControl, FieldLabel } from '../field';
import { Input } from '../input';
import { Fieldset, FieldsetLegend } from './index';

const meta = {
	title: 'Primitive/Fieldset',
	component: Fieldset,
	tags: ['autodocs'],
	args: { disabled: false, className: 'w-80 gap-4' },
	render: (args) => (
		<Fieldset {...args}>
			<FieldsetLegend>阅读偏好</FieldsetLegend>
			<Field>
				<FieldLabel>收藏夹名称</FieldLabel>
				<FieldControl render={<Input />} defaultValue='待读清单' />
			</Field>
			<Field>
				<FieldLabel>每日阅读目标（分钟）</FieldLabel>
				<FieldControl render={<Input />} type='number' min={5} max={120} step={5} defaultValue={30} />
			</Field>
		</Fieldset>
	),
} satisfies Meta<typeof Fieldset>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Bordered: Story = { args: { className: 'bg-base-200 border-base-300 rounded-box w-80 gap-4 border p-5' } };
export const Disabled: Story = {
	args: { disabled: true },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('textbox', { name: '收藏夹名称' })).toBeDisabled();
		await expect(canvas.getByRole('spinbutton', { name: '每日阅读目标（分钟）' })).toBeDisabled();
	},
};
export const Controlled: Story = {
	render: function Render(args) {
		const [name, setName] = useState('待读清单');
		return (
			<Fieldset {...args}>
				<FieldsetLegend>阅读偏好</FieldsetLegend>
				<Field>
					<FieldLabel>收藏夹名称</FieldLabel>
					<FieldControl render={<Input />} value={name} onValueChange={setName} />
				</Field>
				<output aria-label='收藏夹预览'>{name}</output>
			</Fieldset>
		);
	},
	play: async ({ canvas, userEvent }) => {
		const input = canvas.getByRole('textbox', { name: '收藏夹名称' });
		await userEvent.clear(input);
		await userEvent.type(input, '周末阅读');
		await expect(canvas.getByLabelText('收藏夹预览')).toHaveTextContent('周末阅读');
		await expect(canvas.getByRole('group', { name: '阅读偏好' })).toBeVisible();
	},
};
