import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Accordion } from './index';

function AccordionDemo({ multiple = false, disabled = false }: { multiple?: boolean; disabled?: boolean }) {
	const [value, setValue] = useState<string[]>([]);
	return (
		<div className='grid w-80 gap-3'>
			<Accordion.Root
				value={value}
				onValueChange={setValue}
				multiple={multiple}
				className='rounded-box border border-base-300'
			>
				{['Delivery', 'Returns', 'Billing'].map((name) => (
					<Accordion.Item
						key={name}
						value={name}
						disabled={disabled && name === 'Billing'}
						className='border-b border-base-300 last:border-0'
					>
						<Accordion.Header>
							<Accordion.Trigger className='btn btn-ghost w-full justify-between'>
								{name}
								<span aria-hidden='true'>+</span>
							</Accordion.Trigger>
						</Accordion.Header>
						<Accordion.Panel className='p-4'>
							{name === 'Delivery'
								? 'Delivery takes three working days.'
								: name === 'Returns'
									? 'Return unused items within 30 days.'
									: 'Invoices are available in your account.'}
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion.Root>
			<output aria-label='Expanded sections'>{value.join(', ') || 'None'}</output>
		</div>
	);
}

const meta = { title: 'Base/Accordion', component: AccordionDemo, tags: ['autodocs'] } satisfies Meta<
	typeof AccordionDemo
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, userEvent }) => {
		const trigger = canvas.getByRole('button', { name: 'Delivery' });
		await userEvent.click(trigger);
		await expect(canvas.getByText('Delivery takes three working days.')).toBeVisible();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await userEvent.click(trigger);
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	},
};
export const MultipleControlled: Story = { args: { multiple: true } };
export const DisabledItem: Story = { args: { disabled: true } };
