import type { Meta, StoryObj } from '@storybook/react-vite';
import { type McpServerConfig, McpServerConfigSchema } from '@wener/ai/mcp';
import { ModelSchema, type Provider, ProviderSchema, ServiceSchema } from '@wener/ai/schema';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AiModelEditor } from '../../registry/default/blocks/ai-model-editor';
import { AiProviderEditor } from '../../registry/default/blocks/ai-provider-editor';
import { AiServiceEditor } from '../../registry/default/blocks/ai-service-editor';
import { McpServerEditor } from '../../registry/default/blocks/mcp-server-editor';

const provider = ProviderSchema.parse({
	id: 'provider-example',
	name: 'example-provider',
	title: 'Example Provider',
	apiType: 'openai-chat-completions',
	baseUrl: 'https://api.example.com/v1',
	apiKey: 'placeholder-secret',
	endpoints: ['endpoint-example'],
	capabilities: ['message-generation'],
	tags: ['public-example'],
	enabled: true,
});
const model = ModelSchema.parse({
	id: 'model-example',
	name: 'example-model',
	providerId: 'provider-example',
	endpointId: 'endpoint-example',
	type: 'chat',
	apiType: 'openai-chat-completions',
	contextWindow: 32768,
	maxOutputTokens: 4096,
	modalities: { input: ['text', 'image'], output: ['text'] },
	capabilities: { messageGeneration: true, toolCall: true },
	enabled: true,
});
const service = ServiceSchema.parse({
	id: 'service-example',
	name: 'example-service',
	title: 'Example AI Service',
	type: 'ai',
	apiType: 'openai-responses',
	baseUrl: 'https://service.example.com',
	apiKey: 'placeholder-service-secret',
	capabilities: ['message-generation'],
	enabled: true,
});
const mcp = McpServerConfigSchema.parse({
	id: 'mcp-example',
	name: 'example-mcp',
	title: 'Example MCP',
	transport: 'streamable-http',
	url: 'https://mcp.example.com',
	headers: { Authorization: 'Bearer placeholder-token' },
	enabled: true,
});

const meta = {
	id: 'agent-ai-config-editors',
	title: 'Agent/配置编辑器/AI Resources',
	component: AiProviderEditor,
	args: { value: provider, onChange: () => undefined },
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AiProviderEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ProviderWorkflow: Story = {
	name: 'Provider 创建、校验、JSON 与 Secret',
	render: () => <ProviderWorkflowDemo />,
	play: async ({ canvasElement }) => {
		canvasElement.dataset.aiProviderPlay = 'running';
		const canvas = within(canvasElement);
		const secret = canvas.getByLabelText('API Key');
		await expect(secret).toHaveAttribute('type', 'password');
		await userEvent.click(canvas.getByRole('button', { name: '显示密钥' }));
		await expect(secret).toHaveAttribute('type', 'text');
		await userEvent.click(canvas.getByRole('button', { name: '清除密钥' }));
		await expect(secret).toHaveValue('');

		const id = canvas.getByLabelText(/^ID/);
		await userEvent.clear(id);
		await expect(canvas.getByText('请检查以下配置问题')).toBeInTheDocument();
		await expect(canvas.getByRole('status', { name: 'Provider change count' })).toHaveTextContent('1');
		await userEvent.type(id, 'provider-created');
		await waitFor(() =>
			expect(canvas.getByRole('status', { name: 'Provider id' })).toHaveTextContent('provider-created'),
		);

		await userEvent.click(canvas.getByRole('button', { name: /^JSON$/ }));
		const json = canvas.getByLabelText('配置 JSON');
		await userEvent.clear(json);
		await userEvent.click(json);
		await userEvent.paste('{invalid');
		await userEvent.click(canvas.getByRole('button', { name: '应用 JSON' }));
		await expect(canvas.getByText(/JSON 内容无法解析/)).toBeInTheDocument();
		await userEvent.clear(json);
		await userEvent.click(json);
		await userEvent.paste(
			JSON.stringify({
				id: 'provider-json',
				name: 'json-provider',
				baseUrl: 'https://json.example.com/v1',
				enabled: true,
			}),
		);
		await userEvent.click(canvas.getByRole('button', { name: '应用 JSON' }));
		await waitFor(() => expect(canvas.getByRole('status', { name: 'Provider id' })).toHaveTextContent('provider-json'));
		canvasElement.dataset.aiProviderPlay = 'complete';
	},
};

export const ModelAndService: Story = {
	name: 'Model 与 Service',
	render: () => <ModelServiceDemo />,
};

export const McpTransportWorkflow: Story = {
	name: 'MCP Transport 切换',
	render: () => <McpWorkflowDemo />,
	play: async ({ canvasElement }) => {
		canvasElement.dataset.mcpTransportPlay = 'running';
		const canvas = within(canvasElement);
		await expect(canvas.getByLabelText(/^Server URL/)).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('radio', { name: 'stdio' }));
		await expect(canvas.getByLabelText(/^命令/)).toHaveValue('node');
		await expect(canvas.queryByLabelText(/^Server URL/)).not.toBeInTheDocument();
		await expect(canvas.getByRole('status', { name: 'MCP transport' })).toHaveTextContent('stdio');
		await userEvent.click(canvas.getByRole('radio', { name: 'sse' }));
		await expect(canvas.getByLabelText(/^Server URL/)).toHaveValue('https://example.com/mcp');
		canvasElement.dataset.mcpTransportPlay = 'complete';
	},
};

function ProviderWorkflowDemo() {
	const [value, setValue] = useState<Provider>(provider);
	const [changes, setChanges] = useState(0);
	return (
		<main className='bg-base-200 min-h-screen p-2 sm:p-6'>
			<div className='mx-auto max-w-6xl space-y-2'>
				<AiProviderEditor
					value={value}
					onChange={(next) => {
						setChanges((current) => current + 1);
						setValue(next);
					}}
				/>
				<div className='flex gap-4 text-xs'>
					<output aria-label='Provider id'>ID: {value.id}</output>
					<output aria-label='Provider change count'>变更: {changes}</output>
				</div>
			</div>
		</main>
	);
}

function ModelServiceDemo() {
	const [modelValue, setModelValue] = useState(model);
	const [serviceValue, setServiceValue] = useState(service);
	return (
		<main className='bg-base-200 min-h-screen p-2 sm:p-6'>
			<div className='mx-auto max-w-7xl space-y-4'>
				<AiModelEditor
					value={modelValue}
					providerOptions={[{ value: 'provider-example', label: 'Example Provider' }]}
					endpointOptions={[{ value: 'endpoint-example', label: 'Example Endpoint' }]}
					onChange={setModelValue}
				/>
				<AiServiceEditor
					value={serviceValue}
					providerOptions={[{ value: 'provider-example', label: 'Example Provider' }]}
					endpointOptions={[{ value: 'endpoint-example', label: 'Example Endpoint' }]}
					onChange={setServiceValue}
				/>
			</div>
		</main>
	);
}

function McpWorkflowDemo() {
	const [value, setValue] = useState<McpServerConfig>(mcp);
	return (
		<main className='bg-base-200 min-h-screen p-2 sm:p-6'>
			<div className='mx-auto max-w-5xl space-y-2'>
				<McpServerEditor value={value} onChange={setValue} />
				<output aria-label='MCP transport' className='text-xs'>
					Transport: {value.transport}
				</output>
			</div>
		</main>
	);
}
