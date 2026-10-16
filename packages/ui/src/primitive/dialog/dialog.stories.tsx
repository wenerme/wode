import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Dialog } from './index';

function DialogDemo({ nested = false, disabled = false }: { nested?: boolean; disabled?: boolean }) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState('Ada');
	const [savedName, setSavedName] = useState('Ada');
	return (
		<div className='grid justify-items-start gap-3'>
			<Dialog.Root open={open} onOpenChange={setOpen}>
				<Dialog.Trigger className='btn btn-primary' disabled={disabled}>
					Edit profile
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Title className='text-xl font-semibold'>Profile details</Dialog.Title>
					<Dialog.Description>Your display name is visible to your teammates.</Dialog.Description>
					<form
						className='grid gap-4'
						onSubmit={(event) => {
							event.preventDefault();
							setSavedName(name);
							setOpen(false);
						}}
					>
						<label className='grid gap-2'>
							Display name
							<input className='input w-full' value={name} onChange={(event) => setName(event.target.value)} required />
						</label>
						<div className='flex justify-end gap-2'>
							<Dialog.Close className='btn' type='button'>
								Cancel
							</Dialog.Close>
							<button className='btn btn-primary' type='submit'>
								Save profile
							</button>
						</div>
					</form>
					{nested && (
						<Dialog.Root>
							<Dialog.Trigger className='btn btn-outline'>Profile visibility</Dialog.Trigger>
							<Dialog.Content>
								<Dialog.Title className='text-xl font-semibold'>Visibility information</Dialog.Title>
								<Dialog.Description>Only workspace members can see your profile.</Dialog.Description>
								<Dialog.Close className='btn'>Return to profile</Dialog.Close>
							</Dialog.Content>
						</Dialog.Root>
					)}
				</Dialog.Content>
			</Dialog.Root>
			<output aria-label='Saved display name'>{savedName}</output>
		</div>
	);
}

const meta = { title: 'Primitive/Dialog', component: DialogDemo, tags: ['autodocs'] } satisfies Meta<typeof DialogDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const trigger = canvas.getByRole('button', { name: 'Edit profile' });
		const page = within(canvasElement.ownerDocument.body);
		await userEvent.click(trigger);
		const dialog = await page.findByRole('dialog', { name: 'Profile details' });
		const input = within(dialog).getByLabelText('Display name');
		await waitFor(() => expect(input).toHaveFocus());
		await userEvent.clear(input);
		await userEvent.type(input, 'Grace');
		await userEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }));
		await expect(canvas.getByLabelText('Saved display name')).toHaveTextContent('Grace');
		await waitFor(() => expect(page.queryByRole('dialog', { name: 'Profile details' })).not.toBeInTheDocument());
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};
export const Nested: Story = { args: { nested: true } };
export const DisabledTrigger: Story = { args: { disabled: true } };
