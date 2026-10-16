import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Combobox } from './index';

const languages = ['TypeScript', 'JavaScript', 'Rust', 'Go', 'Python'];

function ComboboxDemo({ disabled = false, multiple = false }: { disabled?: boolean; multiple?: boolean }) {
	const id = useId();
	const [value, setValue] = useState<string | string[] | null>(multiple ? [] : null);
	return (
		<div className='grid w-80 gap-2'>
			<label htmlFor={id}>Language</label>
			<Combobox.Root items={languages} multiple={multiple} value={value} onValueChange={setValue} disabled={disabled}>
				<div className='flex gap-2'>
					<Combobox.Input id={id} className='input min-w-0 flex-1' placeholder='Choose a language' />
					<Combobox.Trigger className='btn' aria-label='Show languages'>
						↓
					</Combobox.Trigger>
				</div>
				<Combobox.Portal>
					<Combobox.Positioner sideOffset={6} className='z-50'>
						<Combobox.Popup className='rounded-box border border-base-300 bg-base-100 p-2 text-base-content shadow-lg'>
							<Combobox.Empty className='p-2'>No matching languages.</Combobox.Empty>
							<Combobox.List>
								{(language: string) => (
									<Combobox.Item
										key={language}
										value={language}
										className='rounded-field flex cursor-default gap-2 px-3 py-2 data-highlighted:bg-base-200'
									>
										<Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
										{language}
									</Combobox.Item>
								)}
							</Combobox.List>
						</Combobox.Popup>
					</Combobox.Positioner>
				</Combobox.Portal>
			</Combobox.Root>
			<output aria-label='Selected languages'>
				{Array.isArray(value) ? value.join(', ') || 'None' : value || 'None'}
			</output>
			<button
				type='button'
				className='btn btn-ghost'
				disabled={disabled}
				onClick={() => setValue(multiple ? [] : null)}
			>
				Reset selection
			</button>
		</div>
	);
}

const meta = { title: 'Base/Combobox', component: ComboboxDemo, tags: ['autodocs'] } satisfies Meta<
	typeof ComboboxDemo
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, canvasElement, userEvent }) => {
		const page = within(canvasElement.ownerDocument.body);
		const input = canvas.getByRole('combobox', { name: 'Language' });
		await userEvent.click(canvas.getByRole('button', { name: 'Show languages' }));
		await userEvent.click(await page.findByRole('option', { name: 'Rust' }));
		await expect(canvas.getByLabelText('Selected languages')).toHaveTextContent('Rust');
		await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
		await expect(input).toHaveFocus();
		await userEvent.click(canvas.getByRole('button', { name: 'Reset selection' }));
		await expect(canvas.getByLabelText('Selected languages')).toHaveTextContent('None');
	},
};
export const MultipleControlled: Story = {
	args: { multiple: true },
	play: async ({ canvas, canvasElement, userEvent }) => {
		const page = within(canvasElement.ownerDocument.body);
		await userEvent.click(canvas.getByRole('button', { name: 'Show languages' }));
		await userEvent.click(await page.findByRole('option', { name: 'Rust' }));
		await userEvent.click(await page.findByRole('option', { name: 'Go' }));
		await expect(canvas.getByLabelText('Selected languages')).toHaveTextContent('Rust, Go');
		await userEvent.keyboard('{Escape}');
		await waitFor(() =>
			expect(canvas.getByRole('combobox', { name: 'Language' })).toHaveAttribute('aria-expanded', 'false'),
		);
		await userEvent.click(canvas.getByRole('button', { name: 'Reset selection' }));
		await expect(canvas.getByLabelText('Selected languages')).toHaveTextContent('None');
	},
};
export const Disabled: Story = { args: { disabled: true } };
