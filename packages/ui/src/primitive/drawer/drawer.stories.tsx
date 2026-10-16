import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Drawer } from './index';

function DrawerDemo({
	longContent = false,
	confirmDismissal = false,
}: {
	longContent?: boolean;
	confirmDismissal?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [quantity, setQuantity] = useState(1);
	return (
		<Drawer.Root open={open} onOpenChange={setOpen} swipeDirection='down' disablePointerDismissal={confirmDismissal}>
			<Drawer.Trigger className='btn btn-primary'>Review order</Drawer.Trigger>
			<Drawer.Content>
				<Drawer.Header>
					<Drawer.Title className='text-xl font-semibold'>Order summary</Drawer.Title>
					<Drawer.Description>Adjust your order, then close the drawer to continue shopping.</Drawer.Description>
				</Drawer.Header>
				<div className='my-6 grid gap-4'>
					<p>Notebook · $12 each</p>
					<label className='grid gap-2'>
						Quantity
						<input
							type='number'
							className='input w-full'
							min={1}
							max={20}
							value={quantity}
							onChange={(event) => setQuantity(Number(event.target.value))}
						/>
					</label>
					<output aria-label='Order total'>Total: ${quantity * 12}</output>
					{longContent && (
						<div className='grid gap-4'>
							{Array.from({ length: 12 }, (_, index) => (
								<p key={index}>
									Order detail {index + 1}: Recycled paper, plastic-free packaging, and tracked delivery. Scroll to
									inspect all details before returning to your cart.
								</p>
							))}
						</div>
					)}
					{confirmDismissal && (
						<p>Outside clicks are ignored. Use the close button, Escape, or swipe down to dismiss.</p>
					)}
				</div>
				<Drawer.Footer>
					<Drawer.Close className='btn btn-primary'>Continue shopping</Drawer.Close>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	);
}

const meta = { title: 'Primitive/Drawer', component: DrawerDemo, tags: ['autodocs'] } satisfies Meta<typeof DrawerDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const page = within(canvasElement.ownerDocument.body);
		const trigger = canvas.getByRole('button', { name: 'Review order' });
		await userEvent.click(trigger);
		const drawer = await page.findByRole('dialog', { name: 'Order summary' });
		await expect(drawer).toBeVisible();
		await waitFor(() => expect(drawer.contains(canvasElement.ownerDocument.activeElement)).toBe(true));
		await userEvent.click(within(drawer).getByRole('button', { name: 'Continue shopping' }));
		await waitFor(() => expect(page.queryByRole('dialog', { name: 'Order summary' })).not.toBeInTheDocument());
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};
export const ScrollableMobileContent: Story = {
	args: { longContent: true },
	globals: { viewport: { value: 'mobile1', isRotated: false } },
};
export const ExplicitDismissal: Story = { args: { confirmDismissal: true } };
