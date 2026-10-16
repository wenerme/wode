import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Popover } from './index';

function PopoverDemo({ side = 'bottom', disabled = false }: { side?: 'bottom' | 'right'; disabled?: boolean }) {
	const [open, setOpen] = useState(false);
	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger className='btn' disabled={disabled}>
				Reading preferences
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Positioner side={side} sideOffset={8} className='z-50'>
					<Popover.Popup className='grid w-72 gap-3 rounded-box border border-base-300 bg-base-100 p-4 text-base-content shadow-lg'>
						<Popover.Title className='font-semibold'>Reading layout</Popover.Title>
						<Popover.Description>Choose the width of your reading column.</Popover.Description>
						<label className='grid gap-2'>
							Column width
							<select className='select w-full' defaultValue='Comfortable'>
								<option>Compact</option>
								<option>Comfortable</option>
								<option>Wide</option>
							</select>
						</label>
						<Popover.Close className='btn btn-primary'>Apply layout</Popover.Close>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}

const meta = { title: 'Base/Popover', component: PopoverDemo, tags: ['autodocs'] } satisfies Meta<typeof PopoverDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const trigger = canvas.getByRole('button', { name: 'Reading preferences' });
		await userEvent.click(trigger);
		const popup = await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Reading layout' });
		await userEvent.selectOptions(within(popup).getByLabelText('Column width'), 'Wide');
		await userEvent.click(within(popup).getByRole('button', { name: 'Apply layout' }));
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
	},
};
export const RightPlacement: Story = { args: { side: 'right' } };
export const DisabledTrigger: Story = { args: { disabled: true } };
