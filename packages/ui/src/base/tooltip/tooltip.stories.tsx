import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Tooltip } from './index';

function TooltipDemo({ side = 'top', disabled = false }: { side?: 'top' | 'right'; disabled?: boolean }) {
	const [open, setOpen] = useState(false);
	const descriptionId = useId();
	return (
		<Tooltip.Provider delay={0}>
			<Tooltip.Root disabled={disabled} open={open} onOpenChange={setOpen}>
				<Tooltip.Trigger className='btn' aria-describedby={open ? descriptionId : undefined}>
					Save document
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Positioner side={side} sideOffset={6} className='z-50'>
						<Tooltip.Popup
							id={descriptionId}
							role='tooltip'
							className='rounded-field bg-neutral px-3 py-2 text-sm text-neutral-content'
						>
							Save your current changes
						</Tooltip.Popup>
					</Tooltip.Positioner>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Tooltip.Provider>
	);
}

const meta = { title: 'Base/Tooltip', component: TooltipDemo, tags: ['autodocs'] } satisfies Meta<typeof TooltipDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const trigger = canvas.getByRole('button', { name: 'Save document' });
		const page = within(canvasElement.ownerDocument.body);
		await userEvent.hover(trigger);
		const tooltip = await page.findByRole('tooltip');
		await expect(tooltip).toBeVisible();
		await expect(tooltip).toHaveTextContent('Save your current changes');
		await expect(trigger).toHaveAccessibleDescription('Save your current changes');
		await userEvent.unhover(trigger);
		await waitFor(() => expect(page.queryByRole('tooltip')).not.toBeInTheDocument());
	},
};
export const RightPlacement: Story = { args: { side: 'right' } };
export const DisabledTooltip: Story = { args: { disabled: true } };
