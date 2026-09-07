/** @vitest-environment jsdom */

import { PersonaSchema } from '@wener/ai/agent/persona';
import { SkillSchema } from '@wener/ai/agent/skill';
import { McpServerConfigSchema } from '@wener/ai/mcp';
import { EndpointSchema, ModelSchema, ProviderSchema, ServiceSchema } from '@wener/ai/schema';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { AgentConfigStudio } from './agent-config-studio';
import { endpointOptionsForProvider, resourcesForKind } from './agent-config-studio-editor';
import type { AgentConfigStudioSelection } from './agent-config-studio-types';

const data = {
	providers: [
		ProviderSchema.parse({
			id: 'provider-example',
			name: 'example-provider',
			endpoints: ['endpoint-example'],
			enabled: true,
		}),
	],
	endpoints: [
		EndpointSchema.parse({
			id: 'endpoint-example',
			name: 'example-endpoint',
			title: 'Example Endpoint',
			providerId: 'provider-example',
			enabled: true,
		}),
		EndpointSchema.parse({ id: 'endpoint-shared', name: 'shared-endpoint', enabled: true }),
		EndpointSchema.parse({
			id: 'endpoint-foreign',
			name: 'foreign-endpoint',
			providerId: 'provider-other',
			enabled: true,
		}),
	],
	models: [
		ModelSchema.parse({ id: 'model-example', name: 'example-model', providerId: 'provider-example', enabled: true }),
	],
	services: [
		ServiceSchema.parse({
			id: 'service-example',
			name: 'example-service',
			type: 'ai',
			providerId: 'provider-example',
			defaultEndpointId: 'endpoint-example',
			enabled: true,
		}),
	],
	mcpServers: [
		McpServerConfigSchema.parse({
			id: 'mcp-example',
			name: 'example-mcp',
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
const changes = {
	onProvidersChange: () => undefined,
	onEndpointsChange: () => undefined,
	onModelsChange: () => undefined,
	onServicesChange: () => undefined,
	onMcpServersChange: () => undefined,
	onPersonasChange: () => undefined,
	onSkillsChange: () => undefined,
};

describe('AgentConfigStudio', () => {
	it('renders a responsive controlled master/detail model view', () => {
		const markup = renderToStaticMarkup(
			<AgentConfigStudio
				{...data}
				{...changes}
				selection={{ kind: 'model', id: 'model-example' }}
				onSelectionChange={() => undefined}
			/>,
		);
		expect(markup).toContain('data-slot="agent-config-studio"');
		expect(markup).toContain('role="tablist"');
		expect(markup).toContain('aria-label="配置资源类型"');
		expect(markup).toContain('AI 提供方');
		expect(markup).toContain('AI Endpoint');
		expect(markup).toContain('AI 模型');
		expect(markup).toContain('aria-controls=');
		expect(markup).toContain('role="tabpanel"');
		expect(markup).toContain('aria-selected="true"');
		expect(markup).toContain('example-model');
		expect(markup).toContain('AI Model 配置');
		expect(markup).toContain('md:grid-cols-[16rem_minmax(0,1fr)]');
	});

	it('uses canonical Endpoint ownership for Model and Service reference options', () => {
		expect(endpointOptionsForProvider(data.endpoints, 'provider-example').map((option) => option.value)).toEqual([
			'endpoint-example',
			'endpoint-shared',
		]);
		expect(endpointOptionsForProvider(data.endpoints).map((option) => option.value)).toEqual([
			'endpoint-example',
			'endpoint-shared',
			'endpoint-foreign',
		]);
		const markup = renderToStaticMarkup(
			<AgentConfigStudio
				{...data}
				{...changes}
				selection={{ kind: 'model', id: 'model-example' }}
				onSelectionChange={() => undefined}
			/>,
		);
		expect(markup).toContain('Example Endpoint · endpoint-example');
		expect(markup).toContain('shared-endpoint · endpoint-shared');
		expect(markup).not.toContain('foreign-endpoint · endpoint-foreign');
		const serviceMarkup = renderToStaticMarkup(
			<AgentConfigStudio
				{...data}
				{...changes}
				selection={{ kind: 'service', id: 'service-example' }}
				onSelectionChange={() => undefined}
			/>,
		);
		expect(serviceMarkup).toContain('Example Endpoint · endpoint-example');
		expect(serviceMarkup).toContain('shared-endpoint · endpoint-shared');
		expect(serviceMarkup).not.toContain('foreign-endpoint · endpoint-foreign');
	});

	it('updates the controlled Endpoint collection and selection identity', async () => {
		const container = document.createElement('div');
		document.body.append(container);
		const root = createRoot(container);
		function Harness() {
			const [endpoints, setEndpoints] = useState(data.endpoints);
			const [selection, setSelection] = useState<AgentConfigStudioSelection>({
				kind: 'endpoint',
				id: 'endpoint-example',
			});
			return (
				<>
					<AgentConfigStudio
						{...data}
						{...changes}
						endpoints={endpoints}
						onEndpointsChange={setEndpoints}
						selection={selection}
						onSelectionChange={setSelection}
					/>
					<output aria-label='endpoint ids'>{endpoints.map((endpoint) => endpoint.id).join(',')}</output>
					<output aria-label='selection id'>{selection.id}</output>
				</>
			);
		}
		try {
			await act(async () => root.render(<Harness />));
			expect(container.textContent).toContain('AI Endpoint 配置');
			await changeValue(labeledInput(container, 'ID'), 'endpoint-updated');
			expect(container.querySelector('output[aria-label="endpoint ids"]')?.textContent).toContain('endpoint-updated');
			expect(container.querySelector('output[aria-label="selection id"]')?.textContent).toBe('endpoint-updated');
		} finally {
			await act(async () => root.unmount());
			container.remove();
		}
	});

	it('keeps same-name Skill versions independently addressable', () => {
		const versionedSkills = [
			SkillSchema.parse({
				name: 'review',
				description: 'First version',
				instructions: 'FIRST_VERSION',
				version: '1',
			}),
			SkillSchema.parse({
				name: 'review',
				description: 'Second version',
				instructions: 'SECOND_VERSION',
				version: '2',
			}),
		];
		const resources = resourcesForKind('skill', { ...data, skills: versionedSkills });
		expect(resources[0]?.id).not.toBe(resources[1]?.id);
		const markup = renderToStaticMarkup(
			<AgentConfigStudio
				{...data}
				{...changes}
				skills={versionedSkills}
				selection={{ kind: 'skill', id: resources[1]!.id }}
				onSelectionChange={() => undefined}
			/>,
		);
		expect(markup).toContain('SECOND_VERSION');
		expect(markup).not.toContain('FIRST_VERSION');
	});

	it('shows a deliberate empty detail when controlled selection has no resource', () => {
		const markup = renderToStaticMarkup(
			<AgentConfigStudio
				{...data}
				{...changes}
				selection={{ kind: 'skill', id: 'missing' }}
				onSelectionChange={() => undefined}
			/>,
		);
		expect(markup).toContain('请选择一个资源开始编辑');
		expect(markup).not.toContain('Agent Skill 配置');
	});

	it('rejects duplicate resource identity without emitting a colliding collection', async () => {
		const container = document.createElement('div');
		document.body.append(container);
		const root = createRoot(container);
		const providerA = ProviderSchema.parse({ id: 'provider-a', name: 'provider-a', enabled: true });
		const providerB = ProviderSchema.parse({ id: 'provider-b', name: 'provider-b', enabled: true });
		function Harness() {
			const [providers, setProviders] = useState([providerA, providerB]);
			const [selection, setSelection] = useState<AgentConfigStudioSelection>({ kind: 'provider', id: 'provider-a' });
			return (
				<>
					<AgentConfigStudio
						{...data}
						{...changes}
						providers={providers}
						selection={selection}
						onProvidersChange={setProviders}
						onSelectionChange={setSelection}
					/>
					<output aria-label='provider ids'>{providers.map((provider) => provider.id).join(',')}</output>
				</>
			);
		}
		try {
			await act(async () => root.render(<Harness />));
			const idInput = labeledInput(container, 'ID');
			await changeValue(idInput, 'provider-b');
			expect(container.textContent).toContain('资源 ID“provider-b”已存在');
			expect(container.querySelector('output[aria-label="provider ids"]')?.textContent).toBe('provider-a,provider-b');
			expect(idInput.getAttribute('aria-invalid')).toBe('true');
		} finally {
			await act(async () => root.unmount());
			container.remove();
		}
	});

	it('uses roving focus for Arrow, Home, and End tab navigation', async () => {
		const container = document.createElement('div');
		document.body.append(container);
		const root = createRoot(container);
		function Harness() {
			const [selection, setSelection] = useState<AgentConfigStudioSelection>({
				kind: 'provider',
				id: 'provider-example',
			});
			return <AgentConfigStudio {...data} {...changes} selection={selection} onSelectionChange={setSelection} />;
		}
		try {
			await act(async () => root.render(<Harness />));
			const tabs = [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
			tabs[0]?.focus();
			await act(async () => tabs[0]?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })));
			expect(document.activeElement).toBe(tabs[1]);
			expect(tabs[1]?.getAttribute('aria-selected')).toBe('true');
			await act(async () => tabs[1]?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'End' })));
			expect(document.activeElement).toBe(tabs.at(-1));
			await act(async () => tabs.at(-1)?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Home' })));
			expect(document.activeElement).toBe(tabs[0]);
		} finally {
			await act(async () => root.unmount());
			container.remove();
		}
	});
});

function labeledInput(container: HTMLElement, label: string): HTMLInputElement {
	const matching = [...container.querySelectorAll<HTMLLabelElement>('label')].find((candidate) =>
		candidate.textContent?.trim().startsWith(label),
	);
	const input = matching?.htmlFor ? document.getElementById(matching.htmlFor) : undefined;
	if (!(input instanceof HTMLInputElement)) throw new Error(`input not found: ${label}`);
	return input;
}

async function changeValue(input: HTMLInputElement, value: string) {
	const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
	if (!setter) throw new Error('value setter unavailable');
	await act(async () => {
		setter.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
}
