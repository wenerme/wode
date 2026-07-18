import type { Service } from '@wener/ai/schema';
import type { ComponentPropsWithRef } from 'react';
import type {
	AiConfigEditorOption,
	AiConfigEditorSlots,
	AiConfigSchema,
	AiConfigValidationMode,
	AiResourceEditorMessageOverrides,
	AiResourceEditorMessages,
} from '../../ui/ai-config-editor';

export type AiServiceEditorField =
	| 'id'
	| 'name'
	| 'title'
	| 'description'
	| 'type'
	| 'apiType'
	| 'stage'
	| 'environment'
	| 'env'
	| 'baseUrl'
	| 'host'
	| 'port'
	| 'providerId'
	| 'endpoints'
	| 'defaultEndpointId'
	| 'endpointKey'
	| 'apiKey'
	| 'username'
	| 'password'
	| 'headers'
	| 'auth'
	| 'credentials'
	| 'capabilities'
	| 'tags'
	| 'labels'
	| 'notes'
	| 'options'
	| 'extensions'
	| 'enabled';
export type AiServiceEditorSection = 'identity' | 'connection' | 'authentication' | 'capabilities' | 'metadata';
export type AiServiceEditorMessages = AiResourceEditorMessages<AiServiceEditorField, AiServiceEditorSection>;
export type AiServiceEditorMessageOverrides = AiResourceEditorMessageOverrides<
	AiServiceEditorField,
	AiServiceEditorSection
>;
export type AiServiceEditorProps = Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'title'> & {
	value: Service;
	onChange: (value: Service) => void;
	onSubmit?: (value: Service) => void;
	schema?: AiConfigSchema<Service>;
	validationMode?: AiConfigValidationMode;
	disabled?: boolean;
	readOnly?: boolean;
	messages?: AiServiceEditorMessageOverrides;
	slots?: AiConfigEditorSlots<Service>;
	apiTypeOptions?: readonly AiConfigEditorOption[];
	providerOptions?: readonly AiConfigEditorOption[];
	endpointOptions?: readonly AiConfigEditorOption[];
};
