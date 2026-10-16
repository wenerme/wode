import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Tooltip } from './index';

function TooltipDemo({ side = 'top', disabled = false }: { side?: 'top' | 'right'; disabled?: boolean }) {
	const [open, setOpen] = useState(false);
	const descriptionId = useId();
	return (
		<Tooltip.Provider delay={0}>
			<div className='flex gap-3'>
				<Tooltip.Root disabled={disabled} open={open} onOpenChange={setOpen}>
					<Tooltip.Trigger className='btn' aria-describedby={open ? descriptionId : undefined}>
						Undo change
					</Tooltip.Trigger>
					<Tooltip.Content id={descriptionId} positionerProps={{ side }}>
						Restore the previous version
					</Tooltip.Content>
				</Tooltip.Root>
				<button type='button' className='btn btn-ghost'>
					Next action
				</button>
			</div>
		</Tooltip.Provider>
	);
}

const meta = { title: 'Primitive/Tooltip', component: TooltipDemo, tags: ['autodocs'] } satisfies Meta<
	typeof TooltipDemo
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const page = within(canvasElement.ownerDocument.body);
		const trigger = canvas.getByRole('button', { name: 'Undo change' });
		await userEvent.hover(trigger);
		const tooltip = await page.findByRole('tooltip');
		await waitFor(() => expect(tooltip).toBeVisible());
		await expect(tooltip).toHaveTextContent('Restore the previous version');
		await expect(trigger).toHaveAccessibleDescription('Restore the previous version');
		await userEvent.unhover(trigger);
		await userEvent.click(canvas.getByRole('button', { name: 'Next action' }));
		await userEvent.tab({ shift: true });
		await expect(trigger).toHaveFocus();
		await waitFor(() => expect(page.getByRole('tooltip')).toBeVisible());
		await userEvent.keyboard('{Escape}');
		await userEvent.tab();
		await waitFor(() => expect(page.queryByRole('tooltip')).not.toBeInTheDocument());
	},
};
export const RightPlacement: Story = { args: { side: 'right' } };
export const DisabledTooltip: Story = { args: { disabled: true } };
