import type { Meta, StoryObj } from '@storybook/react-vite';
import { type Endpoint, EndpointSchema } from '@wener/ai/schema';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AiEndpointEditor } from '../../registry/default/blocks/ai-endpoint-editor';

const endpoint = EndpointSchema.parse({
	id: 'endpoint-example',
	name: 'example-endpoint',
	title: 'Example Endpoint',
	providerId: 'provider-example',
	apiType: 'openai-responses',
	baseUrl: 'https://api.example.com/v1',
	headers: { 'X-Example': 'public-example' },
	credentials: { mode: 'example' },
	options: { timeout: 30 },
	tags: ['public-example'],
	enabled: true,
});

const meta = {
	id: 'ai-endpoint-editor',
	title: 'Agent/配置编辑器/AI Endpoint',
	component: AiEndpointEditor,
	args: {
		value: endpoint,
		providerOptions: [{ value: 'provider-example', label: 'Example Provider' }],
		onChange: () => undefined,
	},
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AiEndpointEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FormAndJson: Story = {
	name: '受控 Form 与 JSON',
	render: () => <EndpointEditorDemo />,
	play: async ({ canvasElement }) => {
		canvasElement.dataset.aiEndpointPlay = 'running';
		const canvas = within(canvasElement);
		const baseUrl = canvas.getByLabelText('Base URL');
		await userEvent.clear(baseUrl);
		await userEvent.type(baseUrl, 'https://updated.example.com/v1');
		await waitFor(() =>
			expect(canvas.getByRole('status', { name: 'Endpoint base URL' })).toHaveTextContent(
				'https://updated.example.com/v1',
			),
		);
		await userEvent.click(canvas.getByRole('button', { name: /^JSON$/ }));
		const json = canvas.getByLabelText('配置 JSON');
		await userEvent.clear(json);
		await userEvent.click(json);
		await userEvent.paste(JSON.stringify({ id: 'endpoint-invalid', name: 'invalid', metadata: {} }));
		await userEvent.click(canvas.getByRole('button', { name: '应用 JSON' }));
		expect(canvas.getAllByText(/metadata/).length).toBeGreaterThan(0);
		await expect(canvas.getByRole('status', { name: 'Endpoint id' })).toHaveTextContent('endpoint-example');
		await userEvent.clear(json);
		await userEvent.click(json);
		await userEvent.paste(JSON.stringify({ ...endpoint, baseUrl: 'https://updated.example.com/v1' }));
		await userEvent.click(canvas.getByRole('button', { name: '应用 JSON' }));
		await waitFor(() => expect(canvas.queryByText(/Unrecognized key/)).not.toBeInTheDocument());
		await userEvent.click(canvas.getByRole('button', { name: /^表单$/ }));
		await expect(canvas.getByLabelText('Base URL')).toHaveValue('https://updated.example.com/v1');
		canvasElement.dataset.aiEndpointPlay = 'complete';
	},
};

function EndpointEditorDemo() {
	const [value, setValue] = useState<Endpoint>(endpoint);
	return (
		<main className='bg-base-200 min-h-screen p-2 sm:p-6'>
			<div className='mx-auto max-w-6xl space-y-2'>
				<AiEndpointEditor
					value={value}
					providerOptions={[{ value: 'provider-example', label: 'Example Provider' }]}
					onChange={setValue}
				/>
				<div className='flex flex-wrap gap-4 text-xs'>
					<output aria-label='Endpoint id'>ID: {value.id}</output>
					<output aria-label='Endpoint base URL'>Base URL: {value.baseUrl}</output>
				</div>
			</div>
		</main>
	);
}
