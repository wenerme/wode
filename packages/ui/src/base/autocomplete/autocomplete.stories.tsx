import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Autocomplete } from './index';

const cities = ['Amsterdam', 'Berlin', 'Copenhagen', 'Dublin', 'Lisbon'];

function AutocompleteDemo({
	disabled = false,
	inlineCompletion = false,
}: {
	disabled?: boolean;
	inlineCompletion?: boolean;
}) {
	const id = useId();
	const [value, setValue] = useState('');
	return (
		<div className='grid w-80 gap-2'>
			<label htmlFor={id}>Destination</label>
			<Autocomplete.Root
				items={cities}
				value={value}
				onValueChange={setValue}
				disabled={disabled}
				mode={inlineCompletion ? 'both' : 'list'}
			>
				<Autocomplete.InputGroup className='flex gap-2'>
					<Autocomplete.Input id={id} className='input min-w-0 flex-1' placeholder='Search cities' />
					<Autocomplete.Trigger className='btn' aria-label='Show destinations'>
						↓
					</Autocomplete.Trigger>
				</Autocomplete.InputGroup>
				<Autocomplete.Portal>
					<Autocomplete.Positioner sideOffset={6} className='z-50'>
						<Autocomplete.Popup className='rounded-box border border-base-300 bg-base-100 p-2 text-base-content shadow-lg'>
							<Autocomplete.Empty className='p-2'>No matching cities.</Autocomplete.Empty>
							<Autocomplete.List>
								{(city: string) => (
									<Autocomplete.Item
										key={city}
										value={city}
										className='rounded-field cursor-default px-3 py-2 data-highlighted:bg-base-200'
									>
										{city}
									</Autocomplete.Item>
								)}
							</Autocomplete.List>
						</Autocomplete.Popup>
					</Autocomplete.Positioner>
				</Autocomplete.Portal>
			</Autocomplete.Root>
			<output aria-label='Search query'>{value || 'No query'}</output>
		</div>
	);
}

const meta = { title: 'Base/Autocomplete', component: AutocompleteDemo, tags: ['autodocs'] } satisfies Meta<
	typeof AutocompleteDemo
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const page = within(canvasElement.ownerDocument.body);
		const input = canvas.getByRole('combobox', { name: 'Destination' });
		await userEvent.click(canvas.getByRole('button', { name: 'Show destinations' }));
		await expect(await page.findByRole('option', { name: 'Berlin' })).toBeVisible();
		await userEvent.type(input, 'Ber');
		await userEvent.click(await page.findByRole('option', { name: 'Berlin' }));
		await expect(input).toHaveValue('Berlin');
		await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
		await expect(input).toHaveFocus();
		await userEvent.clear(input);
		await userEvent.keyboard('{Escape}');
	},
};
export const InlineCompletion: Story = { args: { inlineCompletion: true } };
export const Disabled: Story = { args: { disabled: true } };
