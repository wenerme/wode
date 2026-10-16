import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { AlertDialog } from './index';

function AlertDialogDemo({
	requireConfirmation = false,
	disabled = false,
}: {
	requireConfirmation?: boolean;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [confirmed, setConfirmed] = useState(false);
	const [result, setResult] = useState('Project retained');
	return (
		<div className='grid justify-items-start gap-3'>
			<AlertDialog.Root
				open={open}
				onOpenChange={(next) => {
					setOpen(next);
					if (!next) setConfirmed(false);
				}}
			>
				<AlertDialog.Trigger className='btn btn-error' disabled={disabled}>
					Delete project
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title className='text-xl font-semibold'>Delete the draft project?</AlertDialog.Title>
						<AlertDialog.Description>
							This demo removes the local draft only. This action cannot be undone.
						</AlertDialog.Description>
					</AlertDialog.Header>
					{requireConfirmation && (
						<label className='flex items-center gap-2'>
							<input
								type='checkbox'
								className='checkbox'
								checked={confirmed}
								onChange={(event) => setConfirmed(event.target.checked)}
							/>
							I understand the consequences
						</label>
					)}
					<AlertDialog.Footer>
						<AlertDialog.Close className='btn'>Keep project</AlertDialog.Close>
						<AlertDialog.Close
							className='btn btn-error'
							disabled={requireConfirmation && !confirmed}
							onClick={() => setResult('Draft deleted')}
						>
							Confirm deletion
						</AlertDialog.Close>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
			<output aria-label='Deletion result'>{result}</output>
		</div>
	);
}

const meta = { title: 'Primitive/AlertDialog', component: AlertDialogDemo, tags: ['autodocs'] } satisfies Meta<
	typeof AlertDialogDemo
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const page = within(canvasElement.ownerDocument.body);
		const trigger = canvas.getByRole('button', { name: 'Delete project' });
		await userEvent.click(trigger);
		let dialog = await page.findByRole('alertdialog', { name: 'Delete the draft project?' });
		const cancel = within(dialog).getByRole('button', { name: 'Keep project' });
		await waitFor(() => expect(cancel).toHaveFocus());
		await userEvent.click(cancel);
		await expect(canvas.getByLabelText('Deletion result')).toHaveTextContent('Project retained');
		await waitFor(() => expect(trigger).toHaveFocus());
		await userEvent.click(trigger);
		dialog = await page.findByRole('alertdialog', { name: 'Delete the draft project?' });
		await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm deletion' }));
		await expect(canvas.getByLabelText('Deletion result')).toHaveTextContent('Draft deleted');
		await waitFor(() =>
			expect(page.queryByRole('alertdialog', { name: 'Delete the draft project?' })).not.toBeInTheDocument(),
		);
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};
export const ExplicitConfirmation: Story = { args: { requireConfirmation: true } };
export const DisabledTrigger: Story = { args: { disabled: true } };
