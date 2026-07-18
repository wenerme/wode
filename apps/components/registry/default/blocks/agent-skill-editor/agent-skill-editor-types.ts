import type { Skill } from '@wener/ai/agent/skill';
import type { ComponentPropsWithRef, ComponentType } from 'react';
import type {
	AiConfigEditorSlots,
	AiConfigSchema,
	AiConfigValidationMode,
	AiResourceEditorMessageOverrides,
	AiResourceEditorMessages,
} from '../../ui/ai-config-editor';

export type AgentSkillEditorField =
	| 'id'
	| 'name'
	| 'description'
	| 'version'
	| 'instructions'
	| 'tags'
	| 'toolRequirements'
	| 'contextRequirements'
	| 'resources'
	| 'metadata'
	| 'extensions'
	| 'preview';
export type AgentSkillEditorSection =
	| 'identity'
	| 'instructions'
	| 'requirements'
	| 'resources'
	| 'extensions'
	| 'preview';
export type AgentSkillEditorMessages = AiResourceEditorMessages<AgentSkillEditorField, AgentSkillEditorSection>;
export type AgentSkillEditorMessageOverrides = AiResourceEditorMessageOverrides<
	AgentSkillEditorField,
	AgentSkillEditorSection
>;
export type AgentSkillPreviewProps = { value: Skill; markdown: string };
export type AgentSkillEditorProps = Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'title'> & {
	value: Skill;
	onChange: (value: Skill) => void;
	onSubmit?: (value: Skill) => void;
	schema?: AiConfigSchema<Skill>;
	validationMode?: AiConfigValidationMode;
	disabled?: boolean;
	readOnly?: boolean;
	messages?: AgentSkillEditorMessageOverrides;
	slots?: AiConfigEditorSlots<Skill>;
	maxToolRequirements?: number;
	maxContextRequirements?: number;
	maxResources?: number;
	preview?: ComponentType<AgentSkillPreviewProps>;
};
