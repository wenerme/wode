import type { Persona } from '@wener/ai/agent/persona';
import type { ComponentPropsWithRef } from 'react';
import type {
	AiConfigEditorSlots,
	AiConfigSchema,
	AiConfigValidationMode,
	AiResourceEditorMessageOverrides,
	AiResourceEditorMessages,
} from '../../ui/ai-config-editor';

export type AgentPersonaEditorField =
	| 'id'
	| 'name'
	| 'version'
	| 'title'
	| 'nickname'
	| 'description'
	| 'author'
	| 'creatorNotes'
	| 'tags'
	| 'language'
	| 'authoring'
	| 'prompts'
	| 'greetings'
	| 'groupGreetings'
	| 'lorebook'
	| 'assets'
	| 'governance'
	| 'rights'
	| 'metadata'
	| 'extensions';
export type AgentPersonaEditorSection =
	| 'identity'
	| 'authoring'
	| 'prompts'
	| 'author'
	| 'lorebook'
	| 'assets'
	| 'governance'
	| 'extensions';
export type AgentPersonaEditorMessages = AiResourceEditorMessages<AgentPersonaEditorField, AgentPersonaEditorSection>;
export type AgentPersonaEditorMessageOverrides = AiResourceEditorMessageOverrides<
	AgentPersonaEditorField,
	AgentPersonaEditorSection
>;
export type AgentPersonaEditorProps = Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'title'> & {
	value: Persona;
	onChange: (value: Persona) => void;
	onSubmit?: (value: Persona) => void;
	schema?: AiConfigSchema<Persona>;
	validationMode?: AiConfigValidationMode;
	disabled?: boolean;
	readOnly?: boolean;
	messages?: AgentPersonaEditorMessageOverrides;
	slots?: AiConfigEditorSlots<Persona>;
	maxLoreEntries?: number;
	maxAssets?: number;
};
