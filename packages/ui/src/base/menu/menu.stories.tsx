import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Menu } from './index';

const popupClass =
	'grid min-w-48 gap-1 rounded-box border border-base-300 bg-base-100 p-2 text-base-content shadow-lg outline-none';
const itemClass =
	'rounded-field px-3 py-2 text-left outline-none data-highlighted:bg-base-200 data-disabled:opacity-50';

function MenuDemo({ nested = false, side = 'bottom' }: { nested?: boolean; side?: 'bottom' | 'right' }) {
	const [action, setAction] = useState('None');
	return (
		<div className='grid justify-items-start gap-3'>
			<Menu.Root>
				<Menu.Trigger className='btn'>Document actions</Menu.Trigger>
				<Menu.Portal>
					<Menu.Positioner side={side} sideOffset={6} className='z-50'>
						<Menu.Popup className={popupClass}>
							<Menu.Item className={itemClass} onClick={() => setAction('Duplicate')}>
								Duplicate
							</Menu.Item>
							<Menu.Item className={itemClass} disabled>
								Delete (owner only)
							</Menu.Item>
							{nested && (
								<Menu.SubmenuRoot>
									<Menu.SubmenuTrigger className={itemClass}>Export</Menu.SubmenuTrigger>
									<Menu.Portal>
										<Menu.Positioner sideOffset={4} className='z-50'>
											<Menu.Popup className={popupClass}>
												<Menu.Item className={itemClass} onClick={() => setAction('Export PDF')}>
													PDF
												</Menu.Item>
												<Menu.Item className={itemClass} onClick={() => setAction('Export Markdown')}>
													Markdown
												</Menu.Item>
											</Menu.Popup>
										</Menu.Positioner>
									</Menu.Portal>
								</Menu.SubmenuRoot>
							)}
						</Menu.Popup>
					</Menu.Positioner>
				</Menu.Portal>
			</Menu.Root>
			<output aria-label='Last document action'>{action}</output>
		</div>
	);
}

const meta = { title: 'Base/Menu', component: MenuDemo, tags: ['autodocs'] } satisfies Meta<typeof MenuDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const page = within(canvasElement.ownerDocument.body);
		const trigger = canvas.getByRole('button', { name: 'Document actions' });
		await userEvent.click(trigger);
		const menu = await page.findByRole('menu', { name: 'Document actions' });
		await expect(within(menu).getByRole('menuitem', { name: 'Delete (owner only)' })).toHaveAttribute(
			'aria-disabled',
			'true',
		);
		await userEvent.click(within(menu).getByRole('menuitem', { name: 'Duplicate' }));
		await expect(canvas.getByLabelText('Last document action')).toHaveTextContent('Duplicate');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};
export const NestedExport: Story = { args: { nested: true } };
export const RightPlacement: Story = { args: { side: 'right' } };
