import type { Persona } from '@wener/ai/agent/persona';
import type { Skill } from '@wener/ai/agent/skill';
import type { McpServerConfig } from '@wener/ai/mcp';
import type { Endpoint, Model, Provider, Service } from '@wener/ai/schema';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export type AgentConfigResourceKind = 'provider' | 'endpoint' | 'model' | 'service' | 'mcp' | 'persona' | 'skill';
export type AgentConfigStudioSelection = { kind: AgentConfigResourceKind; id?: string };
export type AgentConfigStudioMessages = {
	title: string;
	description: string;
	resourceList: string;
	resourceTypes: string;
	emptyList: string;
	emptySelection: string;
	create: string;
	remove: string;
	identityConflict: (id: string) => string;
	kinds: Record<AgentConfigResourceKind, string>;
};
export type AgentConfigStudioProps = Omit<ComponentPropsWithRef<'section'>, 'onChange' | 'title'> & {
	providers: readonly Provider[];
	endpoints: readonly Endpoint[];
	models: readonly Model[];
	services: readonly Service[];
	mcpServers: readonly McpServerConfig[];
	personas: readonly Persona[];
	skills: readonly Skill[];
	onProvidersChange: (value: Provider[]) => void;
	onEndpointsChange: (value: Endpoint[]) => void;
	onModelsChange: (value: Model[]) => void;
	onServicesChange: (value: Service[]) => void;
	onMcpServersChange: (value: McpServerConfig[]) => void;
	onPersonasChange: (value: Persona[]) => void;
	onSkillsChange: (value: Skill[]) => void;
	selection: AgentConfigStudioSelection;
	onSelectionChange: (value: AgentConfigStudioSelection) => void;
	onCreate?: (kind: AgentConfigResourceKind) => void;
	onRemove?: (selection: AgentConfigStudioSelection) => void;
	disabled?: boolean;
	readOnly?: boolean;
	messages?: Partial<Omit<AgentConfigStudioMessages, 'kinds'>> & {
		kinds?: Partial<AgentConfigStudioMessages['kinds']>;
	};
	empty?: ReactNode;
};
