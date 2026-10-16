import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Sheet } from './index';

function SheetDemo({ side = 'right' }: { side?: 'right' | 'left' | 'top' | 'bottom' }) {
	const [open, setOpen] = useState(false);
	const [section, setSection] = useState('Overview');
	return (
		<div className='grid justify-items-start gap-3'>
			<Sheet.Root open={open} onOpenChange={setOpen}>
				<Sheet.Trigger className='btn'>Open navigation</Sheet.Trigger>
				<Sheet.Content side={side}>
					<Sheet.Header>
						<Sheet.Title className='text-xl font-semibold'>Workspace navigation</Sheet.Title>
						<Sheet.Description>Choose a section to update the current workspace view.</Sheet.Description>
					</Sheet.Header>
					<nav aria-label='Workspace sections'>
						<ul className='menu w-full'>
							{['Overview', 'Projects', 'Team', 'Settings'].map((name) => (
								<li key={name}>
									<button
										type='button'
										aria-current={section === name ? 'page' : undefined}
										onClick={() => {
											setSection(name);
											setOpen(false);
										}}
									>
										{name}
									</button>
								</li>
							))}
						</ul>
					</nav>
					<Sheet.Footer>
						<Sheet.Close className='btn'>Close navigation</Sheet.Close>
					</Sheet.Footer>
				</Sheet.Content>
			</Sheet.Root>
			<output aria-label='Current workspace section'>{section}</output>
		</div>
	);
}

const meta = { title: 'Primitive/Sheet', component: SheetDemo, tags: ['autodocs'] } satisfies Meta<typeof SheetDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const trigger = canvas.getByRole('button', { name: 'Open navigation' });
		const page = within(canvasElement.ownerDocument.body);
		await userEvent.click(trigger);
		const sheet = await page.findByRole('dialog', { name: 'Workspace navigation' });
		await userEvent.click(within(sheet).getByRole('button', { name: 'Projects' }));
		await expect(canvas.getByLabelText('Current workspace section')).toHaveTextContent('Projects');
		await waitFor(() => expect(page.queryByRole('dialog', { name: 'Workspace navigation' })).not.toBeInTheDocument());
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};
export const LeftNavigation: Story = { args: { side: 'left' } };
export const TopPanel: Story = { args: { side: 'top' } };
export const BottomPanel: Story = { args: { side: 'bottom' } };
