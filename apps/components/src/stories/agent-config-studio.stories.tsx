import type { Meta, StoryObj } from '@storybook/react-vite';
import { type Persona, PersonaSchema } from '@wener/ai/agent/persona';
import { type Skill, SkillSchema } from '@wener/ai/agent/skill';
import { type McpServerConfig, McpServerConfigSchema } from '@wener/ai/mcp';
import {
	type Endpoint,
	EndpointSchema,
	type Model,
	ModelSchema,
	type Provider,
	ProviderSchema,
	type Service,
	ServiceSchema,
} from '@wener/ai/schema';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { AgentConfigStudio, type AgentConfigStudioSelection } from '../../registry/default/blocks/agent-config-studio';

const initial = {
	providers: [
		ProviderSchema.parse({
			id: 'provider-example',
			name: 'example-provider',
			title: 'Example Provider',
			endpoints: ['endpoint-example'],
			apiType: 'openai-responses',
			baseUrl: 'https://api.example.com/v1',
			enabled: true,
		}),
	],
	endpoints: [
		EndpointSchema.parse({
			id: 'endpoint-example',
			name: 'example-endpoint',
			title: 'Example Endpoint',
			providerId: 'provider-example',
			apiType: 'openai-responses',
			baseUrl: 'https://api.example.com/v1',
			enabled: true,
		}),
	],
	models: [
		ModelSchema.parse({
			id: 'model-example',
			name: 'example-model',
			title: 'Example Model',
			providerId: 'provider-example',
			endpointId: 'endpoint-example',
			type: 'chat',
			enabled: true,
		}),
	],
	services: [
		ServiceSchema.parse({
			id: 'service-example',
			name: 'example-service',
			title: 'Example Service',
			type: 'ai',
			providerId: 'provider-example',
			endpoints: ['endpoint-example'],
			defaultEndpointId: 'endpoint-example',
			baseUrl: 'https://service.example.com',
			enabled: true,
		}),
	],
	mcpServers: [
		McpServerConfigSchema.parse({
			id: 'mcp-example',
			name: 'example-mcp',
			title: 'Example MCP',
			transport: 'streamable-http',
			url: 'https://mcp.example.com',
			enabled: true,
		}),
	],
	personas: [PersonaSchema.parse({ id: 'persona-example', name: '示例角色', version: '1.0.0' })],
	skills: [
		SkillSchema.parse({
			id: 'skill-example',
			name: 'example-skill',
			description: '示例 Skill',
			instructions: '执行示例任务。',
			version: '1.0.0',
		}),
	],
};

const meta = {
	id: 'agent-config-studio',
	title: 'Agent/配置工作室',
	component: AgentConfigStudio,
	args: {
		...initial,
		onProvidersChange: () => undefined,
		onEndpointsChange: () => undefined,
		onModelsChange: () => undefined,
		onServicesChange: () => undefined,
		onMcpServersChange: () => undefined,
		onPersonasChange: () => undefined,
		onSkillsChange: () => undefined,
		selection: { kind: 'provider', id: 'provider-example' },
		onSelectionChange: () => undefined,
	},
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AgentConfigStudio>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ResourceSwitching: Story = {
	name: '资源切换（桌面与移动端）',
	render: () => <StudioDemo />,
	play: async ({ canvasElement }) => {
		canvasElement.dataset.agentStudioPlay = 'running';
		const canvas = within(canvasElement);
		await expect(canvas.getByText('AI Provider 配置')).toBeInTheDocument();
		const providerId = canvas.getByLabelText(/^ID/);
		await userEvent.clear(providerId);
		await userEvent.type(providerId, 'provider-updated');
		await expect(canvas.getByRole('status', { name: 'Studio selection' })).toHaveTextContent(
			'provider:provider-updated',
		);
		await expect(canvas.getByText('AI Provider 配置')).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('tab', { name: /Endpoint/ }));
		await expect(canvas.getByText('AI Endpoint 配置')).toBeInTheDocument();
		await expect(canvas.getByRole('status', { name: 'Studio selection' })).toHaveTextContent(
			'endpoint:endpoint-example',
		);
		const personaTab = canvas.getByRole('tab', { name: /角色/ });
		await userEvent.click(personaTab);
		await expect(canvas.getByText('Agent Persona 配置')).toBeInTheDocument();
		await expect(canvas.getByRole('status', { name: 'Studio selection' })).toHaveTextContent('persona:persona-example');
		personaTab.focus();
		await userEvent.keyboard('{End}');
		await expect(canvas.getByText('Agent Skill 配置')).toBeInTheDocument();
		await expect(canvas.getByRole('tab', { name: /技能/ })).toHaveFocus();
		await userEvent.click(canvas.getByRole('tab', { name: /MCP/ }));
		await expect(canvas.getByText('MCP Server 配置')).toBeInTheDocument();
		canvasElement.dataset.agentStudioPlay = 'complete';
	},
};

function StudioDemo() {
	const [providers, setProviders] = useState<Provider[]>(initial.providers);
	const [endpoints, setEndpoints] = useState<Endpoint[]>(initial.endpoints);
	const [models, setModels] = useState<Model[]>(initial.models);
	const [services, setServices] = useState<Service[]>(initial.services);
	const [mcpServers, setMcpServers] = useState<McpServerConfig[]>(initial.mcpServers);
	const [personas, setPersonas] = useState<Persona[]>(initial.personas);
	const [skills, setSkills] = useState<Skill[]>(initial.skills);
	const [selection, setSelection] = useState<AgentConfigStudioSelection>({ kind: 'provider', id: 'provider-example' });
	return (
		<main className='bg-base-200 min-h-screen'>
			<AgentConfigStudio
				providers={providers}
				endpoints={endpoints}
				models={models}
				services={services}
				mcpServers={mcpServers}
				personas={personas}
				skills={skills}
				onProvidersChange={setProviders}
				onEndpointsChange={setEndpoints}
				onModelsChange={setModels}
				onServicesChange={setServices}
				onMcpServersChange={setMcpServers}
				onPersonasChange={setPersonas}
				onSkillsChange={setSkills}
				selection={selection}
				onSelectionChange={setSelection}
			/>
			<output aria-label='Studio selection' className='badge badge-neutral fixed end-2 bottom-2'>
				{selection.kind}:{selection.id ?? 'none'}
			</output>
		</main>
	);
}
