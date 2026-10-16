import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { DropdownMenu } from './index';

function DropdownMenuDemo({ preferences = false, nested = false }: { preferences?: boolean; nested?: boolean }) {
	const [action, setAction] = useState('None');
	const [showGrid, setShowGrid] = useState(true);
	const [density, setDensity] = useState('comfortable');
	return (
		<div className='grid justify-items-start gap-3'>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger className='btn'>Board actions</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Group>
						<DropdownMenu.Label>Current board</DropdownMenu.Label>
						<DropdownMenu.Item onClick={() => setAction('Board copied')}>Copy board</DropdownMenu.Item>
						<DropdownMenu.Item disabled>Archive (admin only)</DropdownMenu.Item>
					</DropdownMenu.Group>
					{preferences && (
						<>
							<DropdownMenu.Separator />
							<DropdownMenu.CheckboxItem checked={showGrid} onCheckedChange={setShowGrid} closeOnClick={false}>
								<DropdownMenu.CheckboxItemIndicator>✓</DropdownMenu.CheckboxItemIndicator>Show grid
							</DropdownMenu.CheckboxItem>
							<DropdownMenu.RadioGroup value={density} onValueChange={setDensity}>
								<DropdownMenu.RadioItem value='comfortable'>
									<DropdownMenu.RadioItemIndicator>✓</DropdownMenu.RadioItemIndicator>Comfortable
								</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value='compact'>
									<DropdownMenu.RadioItemIndicator>✓</DropdownMenu.RadioItemIndicator>Compact
								</DropdownMenu.RadioItem>
							</DropdownMenu.RadioGroup>
						</>
					)}
					{nested && (
						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger>Share board</DropdownMenu.SubTrigger>
							<DropdownMenu.SubContent>
								<DropdownMenu.Item onClick={() => setAction('Link copied')}>Copy link</DropdownMenu.Item>
								<DropdownMenu.Item onClick={() => setAction('Embed copied')}>Copy embed</DropdownMenu.Item>
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>
					)}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<output aria-label='Last board action'>{action}</output>
			{preferences && (
				<output aria-label='Board preferences'>
					{showGrid ? 'Grid visible' : 'Grid hidden'}; {density}
				</output>
			)}
		</div>
	);
}

const meta = { title: 'Primitive/DropdownMenu', component: DropdownMenuDemo, tags: ['autodocs'] } satisfies Meta<
	typeof DropdownMenuDemo
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const trigger = canvas.getByRole('button', { name: 'Board actions' });
		await userEvent.click(trigger);
		const menu = await within(canvasElement.ownerDocument.body).findByRole('menu', { name: 'Board actions' });
		await expect(within(menu).getByRole('menuitem', { name: 'Archive (admin only)' })).toHaveAttribute(
			'aria-disabled',
			'true',
		);
		await userEvent.click(within(menu).getByRole('menuitem', { name: 'Copy board' }));
		await expect(canvas.getByLabelText('Last board action')).toHaveTextContent('Board copied');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};
export const CheckboxAndRadioItems: Story = {
	args: { preferences: true },
	play: async ({ canvas, canvasElement, userEvent }) => {
		const page = within(canvasElement.ownerDocument.body);
		const trigger = canvas.getByRole('button', { name: 'Board actions' });
		await userEvent.click(trigger);
		const menu = await page.findByRole('menu', { name: 'Board actions' });
		const checkbox = within(menu).getByRole('menuitemcheckbox', { name: /Show grid/ });
		await expect(checkbox).toHaveAttribute('aria-checked', 'true');
		await userEvent.click(checkbox);
		await expect(checkbox).toHaveAttribute('aria-checked', 'false');
		await userEvent.click(within(menu).getByRole('menuitemradio', { name: /Compact/ }));
		await expect(canvas.getByLabelText('Board preferences')).toHaveTextContent('Grid hidden; compact');
		await userEvent.keyboard('{Escape}');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};
export const NestedSharing: Story = { args: { nested: true } };
