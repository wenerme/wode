import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Dialog } from './index';

function DialogDemo({ nested = false, disabled = false }: { nested?: boolean; disabled?: boolean }) {
	const [open, setOpen] = useState(false);
	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger className='btn btn-primary' disabled={disabled}>
				Edit workspace
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Backdrop className='fixed inset-0 z-50 bg-base-content/40' />
				<Dialog.Popup className='fixed top-1/2 left-1/2 z-50 grid w-[calc(100%_-_2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-box bg-base-100 p-6 text-base-content shadow-xl'>
					<Dialog.Title className='text-lg font-semibold'>Workspace settings</Dialog.Title>
					<Dialog.Description>Update the display name for this workspace.</Dialog.Description>
					<label className='grid gap-2'>
						Workspace name
						<input className='input w-full' defaultValue='Design team' />
					</label>
					{nested && (
						<Dialog.Root>
							<Dialog.Trigger className='btn'>Advanced settings</Dialog.Trigger>
							<Dialog.Portal>
								<Dialog.Backdrop className='fixed inset-0 z-50 bg-base-content/40' />
								<Dialog.Popup className='fixed top-1/2 left-1/2 z-50 grid w-72 -translate-x-1/2 -translate-y-1/2 gap-4 rounded-box bg-base-100 p-6 text-base-content shadow-xl'>
									<Dialog.Title>Advanced workspace settings</Dialog.Title>
									<Dialog.Description>Closing this dialog returns to the workspace form.</Dialog.Description>
									<Dialog.Close className='btn'>Back to workspace</Dialog.Close>
								</Dialog.Popup>
							</Dialog.Portal>
						</Dialog.Root>
					)}
					<Dialog.Close className='btn btn-primary'>Done</Dialog.Close>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

const meta = { title: 'Base/Dialog', component: DialogDemo, tags: ['autodocs'] } satisfies Meta<typeof DialogDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const page = within(canvasElement.ownerDocument.body);
		const trigger = canvas.getByRole('button', { name: 'Edit workspace' });
		await userEvent.click(trigger);
		const dialog = await page.findByRole('dialog', { name: 'Workspace settings' });
		await expect(dialog).toBeVisible();
		await waitFor(() => expect(dialog.contains(canvasElement.ownerDocument.activeElement)).toBe(true));
		await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
		await waitFor(() => expect(page.queryByRole('dialog', { name: 'Workspace settings' })).not.toBeInTheDocument());
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};
export const Nested: Story = {
	args: { nested: true },
	play: async ({ canvas, canvasElement, userEvent }) => {
		const page = within(canvasElement.ownerDocument.body);
		const trigger = canvas.getByRole('button', { name: 'Edit workspace' });
		await userEvent.click(trigger);
		const outer = await page.findByRole('dialog', { name: 'Workspace settings' });
		const nestedTrigger = within(outer).getByRole('button', { name: 'Advanced settings' });
		await userEvent.click(nestedTrigger);
		const inner = await page.findByRole('dialog', { name: 'Advanced workspace settings' });
		await expect(inner).toBeVisible();
		await userEvent.click(within(inner).getByRole('button', { name: 'Back to workspace' }));
		await waitFor(() => expect(nestedTrigger).toHaveFocus());
		await expect(outer).toBeVisible();
		await userEvent.click(within(outer).getByRole('button', { name: 'Done' }));
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};
export const DisabledTrigger: Story = { args: { disabled: true } };
