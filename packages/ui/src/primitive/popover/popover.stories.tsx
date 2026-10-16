import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Popover } from './index';

function PopoverDemo({ side = 'bottom', disabled = false }: { side?: 'bottom' | 'right'; disabled?: boolean }) {
	const [open, setOpen] = useState(false);
	const [compact, setCompact] = useState(false);
	return (
		<div className='grid justify-items-start gap-3'>
			<Popover.Root open={open} onOpenChange={setOpen}>
				<Popover.Trigger className='btn' disabled={disabled}>
					Display options
				</Popover.Trigger>
				<Popover.Content positionerProps={{ side }} className='grid gap-3'>
					<Popover.Title className='font-semibold'>Table appearance</Popover.Title>
					<Popover.Description>Adjust the density of rows in your table.</Popover.Description>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							className='checkbox'
							checked={compact}
							onChange={(event) => setCompact(event.target.checked)}
						/>
						Compact rows
					</label>
					<Popover.Close className='btn btn-primary'>Apply options</Popover.Close>
				</Popover.Content>
			</Popover.Root>
			<output aria-label='Table density'>{compact ? 'Compact' : 'Comfortable'}</output>
		</div>
	);
}

const meta = { title: 'Primitive/Popover', component: PopoverDemo, tags: ['autodocs'] } satisfies Meta<
	typeof PopoverDemo
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const trigger = canvas.getByRole('button', { name: 'Display options' });
		await userEvent.click(trigger);
		const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Table appearance' });
		await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Compact rows' }));
		await userEvent.click(within(dialog).getByRole('button', { name: 'Apply options' }));
		await expect(canvas.getByLabelText('Table density')).toHaveTextContent('Compact');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};
export const RightPlacement: Story = { args: { side: 'right' } };
export const DisabledTrigger: Story = { args: { disabled: true } };
