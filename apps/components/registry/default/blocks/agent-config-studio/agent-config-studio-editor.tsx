'use client';

import { type Persona, PersonaSchema } from '@wener/ai/agent/persona';
import { getSkillIdentity, type Skill, SkillSchema } from '@wener/ai/agent/skill';
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
import type { ReactNode } from 'react';
import type { AiConfigSchema } from '../../ui/ai-config-editor';
import { AgentPersonaEditor } from '../agent-persona-editor';
import { AgentSkillEditor } from '../agent-skill-editor';
import { AiEndpointEditor } from '../ai-endpoint-editor';
import { AiModelEditor } from '../ai-model-editor';
import { AiProviderEditor } from '../ai-provider-editor';
import { AiServiceEditor } from '../ai-service-editor';
import { McpServerEditor } from '../mcp-server-editor';
import type {
	AgentConfigResourceKind,
	AgentConfigStudioMessages,
	AgentConfigStudioProps,
	AgentConfigStudioSelection,
} from './agent-config-studio-types';

export type ResourceCollections = Pick<
	AgentConfigStudioProps,
	'providers' | 'endpoints' | 'models' | 'services' | 'mcpServers' | 'personas' | 'skills'
>;
type StudioEditorContext = ResourceCollections &
	Pick<
		AgentConfigStudioProps,
		| 'onProvidersChange'
		| 'onEndpointsChange'
		| 'onModelsChange'
		| 'onServicesChange'
		| 'onMcpServersChange'
		| 'onPersonasChange'
		| 'onSkillsChange'
		| 'onSelectionChange'
		| 'disabled'
		| 'readOnly'
	> & { selection: AgentConfigStudioSelection };
export type StudioResourceItem = { id: string; label: string };

export function resourcesForKind(kind: AgentConfigResourceKind, values: ResourceCollections): StudioResourceItem[] {
	switch (kind) {
		case 'provider':
			return values.providers.map((item) => ({ id: item.id, label: item.title || item.name }));
		case 'endpoint':
			return values.endpoints.map((item) => ({ id: item.id, label: item.title || item.name }));
		case 'model':
			return values.models.map((item) => ({ id: item.id, label: item.title || item.name }));
		case 'service':
			return values.services.map((item) => ({ id: item.id, label: item.title || item.name }));
		case 'mcp':
			return values.mcpServers.map((item, index) => ({
				id: mcpIdentity(item, index),
				label: item.title || item.name || item.id || `MCP Server ${index + 1}`,
			}));
		case 'persona':
			return values.personas.map((item) => ({ id: item.id, label: item.title || item.name }));
		case 'skill':
			return values.skills.map((item) => ({ id: skillIdentity(item), label: item.name }));
	}
}

export function renderSelectedStudioEditor(
	context: StudioEditorContext,
	messages: AgentConfigStudioMessages,
): ReactNode {
	const { selection, disabled, readOnly } = context;
	const providerOptions = context.providers.map((entry) => ({ value: entry.id, label: entry.title || entry.name }));
	switch (selection.kind) {
		case 'provider': {
			const item = context.providers.find((entry) => entry.id === selection.id);
			return item ? (
				<AiProviderEditor
					value={item}
					schema={uniqueIdentitySchema(ProviderSchema, context.providers, item, providerIdentity, 'id', messages)}
					disabled={disabled}
					readOnly={readOnly}
					onChange={(next) =>
						updateStudioResource(
							context.providers,
							item,
							next,
							'provider',
							next.id,
							context.onProvidersChange,
							context.onSelectionChange,
						)
					}
				/>
			) : null;
		}
		case 'endpoint': {
			const item = context.endpoints.find((entry) => entry.id === selection.id);
			return item ? (
				<AiEndpointEditor
					value={item}
					schema={uniqueIdentitySchema(EndpointSchema, context.endpoints, item, endpointIdentity, 'id', messages)}
					providerOptions={providerOptions}
					disabled={disabled}
					readOnly={readOnly}
					onChange={(next) =>
						updateStudioResource(
							context.endpoints,
							item,
							next,
							'endpoint',
							next.id,
							context.onEndpointsChange,
							context.onSelectionChange,
						)
					}
				/>
			) : null;
		}
		case 'model': {
			const item = context.models.find((entry) => entry.id === selection.id);
			return item ? (
				<AiModelEditor
					value={item}
					schema={uniqueIdentitySchema(ModelSchema, context.models, item, modelIdentity, 'id', messages)}
					providerOptions={providerOptions}
					endpointOptions={endpointOptionsForProvider(context.endpoints, item.providerId)}
					disabled={disabled}
					readOnly={readOnly}
					onChange={(next) =>
						updateStudioResource(
							context.models,
							item,
							next,
							'model',
							next.id,
							context.onModelsChange,
							context.onSelectionChange,
						)
					}
				/>
			) : null;
		}
		case 'service': {
			const item = context.services.find((entry) => entry.id === selection.id);
			return item ? (
				<AiServiceEditor
					value={item}
					schema={uniqueIdentitySchema(ServiceSchema, context.services, item, serviceIdentity, 'id', messages)}
					providerOptions={providerOptions}
					endpointOptions={endpointOptionsForProvider(context.endpoints, item.providerId)}
					disabled={disabled}
					readOnly={readOnly}
					onChange={(next) =>
						updateStudioResource(
							context.services,
							item,
							next,
							'service',
							next.id,
							context.onServicesChange,
							context.onSelectionChange,
						)
					}
				/>
			) : null;
		}
		case 'mcp': {
			const index = context.mcpServers.findIndex((entry, itemIndex) => mcpIdentity(entry, itemIndex) === selection.id);
			const item = context.mcpServers[index];
			return item ? (
				<McpServerEditor
					value={item}
					schema={uniqueIdentitySchema(
						McpServerConfigSchema,
						context.mcpServers,
						item,
						(entry) => mcpIdentity(entry, context.mcpServers.indexOf(entry)),
						'id',
						messages,
					)}
					disabled={disabled}
					readOnly={readOnly}
					onChange={(next) =>
						updateStudioResource(
							context.mcpServers,
							item,
							next,
							'mcp',
							next.id || next.name || `mcp-${index + 1}`,
							context.onMcpServersChange,
							context.onSelectionChange,
						)
					}
				/>
			) : null;
		}
		case 'persona': {
			const item = context.personas.find((entry) => entry.id === selection.id);
			return item ? (
				<AgentPersonaEditor
					value={item}
					schema={uniqueIdentitySchema(PersonaSchema, context.personas, item, personaIdentity, 'id', messages)}
					disabled={disabled}
					readOnly={readOnly}
					onChange={(next) =>
						updateStudioResource(
							context.personas,
							item,
							next,
							'persona',
							next.id,
							context.onPersonasChange,
							context.onSelectionChange,
						)
					}
				/>
			) : null;
		}
		case 'skill': {
			const item = context.skills.find((entry) => skillIdentity(entry) === selection.id);
			return item ? (
				<AgentSkillEditor
					value={item}
					schema={uniqueIdentitySchema(SkillSchema, context.skills, item, skillIdentity, 'id', messages)}
					disabled={disabled}
					readOnly={readOnly}
					onChange={(next) =>
						updateStudioResource(
							context.skills,
							item,
							next,
							'skill',
							skillIdentity(next),
							context.onSkillsChange,
							context.onSelectionChange,
						)
					}
				/>
			) : null;
		}
	}
}

function uniqueIdentitySchema<T>(
	base: AiConfigSchema<T>,
	items: readonly T[],
	current: T,
	identity: (value: T) => string,
	field: string,
	messages: AgentConfigStudioMessages,
): AiConfigSchema<T> {
	return {
		safeParse(value) {
			const parsed = base.safeParse(value);
			if (!parsed.success) return parsed;
			const nextId = identity(parsed.data);
			if (items.some((item) => item !== current && identity(item) === nextId)) {
				return {
					success: false,
					error: { issues: [{ path: [field], message: messages.identityConflict(nextId) }] },
				};
			}
			return parsed;
		},
	};
}

function updateStudioResource<T>(
	items: readonly T[],
	current: T,
	next: T,
	kind: AgentConfigResourceKind,
	nextId: string,
	onChange: (items: T[]) => void,
	onSelectionChange: (selection: AgentConfigStudioSelection) => void,
): void {
	onChange(items.map((item) => (item === current ? next : item)));
	onSelectionChange({ kind, id: nextId });
}

export function endpointOptionsForProvider(endpoints: readonly Endpoint[], providerId?: string) {
	return endpoints
		.filter((endpoint) => !providerId || !endpoint.providerId || endpoint.providerId === providerId)
		.map((endpoint) => ({
			value: endpoint.id,
			label: endpointOptionLabel(endpoint),
		}));
}

function endpointOptionLabel(endpoint: Endpoint): string {
	const label = endpoint.title || endpoint.name;
	return label === endpoint.id ? endpoint.id : `${label} · ${endpoint.id}`;
}

function providerIdentity(value: Provider): string {
	return value.id;
}
function endpointIdentity(value: Endpoint): string {
	return value.id;
}
function modelIdentity(value: Model): string {
	return value.id;
}
function serviceIdentity(value: Service): string {
	return value.id;
}
function personaIdentity(value: Persona): string {
	return value.id;
}
function skillIdentity(value: Skill): string {
	return getSkillIdentity(value);
}
function mcpIdentity(value: McpServerConfig, index: number): string {
	return value.id || value.name || `mcp-${index + 1}`;
}
