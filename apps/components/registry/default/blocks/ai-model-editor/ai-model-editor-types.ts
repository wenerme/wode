import type { Model } from '@wener/ai/schema';
import type { ComponentPropsWithRef } from 'react';
import type {
	AiConfigEditorOption,
	AiConfigEditorSlots,
	AiConfigSchema,
	AiConfigValidationMode,
	AiResourceEditorMessageOverrides,
	AiResourceEditorMessages,
} from '../../ui/ai-config-editor';

export type AiModelEditorField =
	| 'id'
	| 'name'
	| 'title'
	| 'description'
	| 'providerId'
	| 'endpointId'
	| 'endpointKey'
	| 'type'
	| 'family'
	| 'apiType'
	| 'contextWindow'
	| 'maxInputTokens'
	| 'maxOutputTokens'
	| 'modalities'
	| 'capabilities'
	| 'limits'
	| 'cost'
	| 'defaults'
	| 'status'
	| 'releaseDate'
	| 'knowledge'
	| 'openWeights'
	| 'headers'
	| 'tags'
	| 'labels'
	| 'options'
	| 'extensions'
	| 'enabled';
export type AiModelEditorSection =
	| 'identity'
	| 'binding'
	| 'limits'
	| 'modalities'
	| 'capabilities'
	| 'costDefaults'
	| 'metadata';
export type AiModelEditorMessages = AiResourceEditorMessages<AiModelEditorField, AiModelEditorSection>;
export type AiModelEditorMessageOverrides = AiResourceEditorMessageOverrides<AiModelEditorField, AiModelEditorSection>;

export type AiModelEditorProps = Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'title'> & {
	value: Model;
	onChange: (value: Model) => void;
	onSubmit?: (value: Model) => void;
	schema?: AiConfigSchema<Model>;
	validationMode?: AiConfigValidationMode;
	disabled?: boolean;
	readOnly?: boolean;
	messages?: AiModelEditorMessageOverrides;
	slots?: AiConfigEditorSlots<Model>;
	providerOptions?: readonly AiConfigEditorOption[];
	endpointOptions?: readonly AiConfigEditorOption[];
	apiTypeOptions?: readonly AiConfigEditorOption[];
};
