import type {
	AiConfigEditorOption,
	AiConfigEditorSlots,
	AiConfigSchema,
	AiConfigValidationMode,
	AiResourceEditorMessageOverrides,
	AiResourceEditorMessages,
} from '@components/ui/ai-config-editor';
import type { Endpoint } from '@wener/ai/schema';
import type { ComponentPropsWithRef } from 'react';

export type AiEndpointEditorField =
	| 'id'
	| 'name'
	| 'providerId'
	| 'key'
	| 'title'
	| 'description'
	| 'apiType'
	| 'baseUrl'
	| 'apiKey'
	| 'headers'
	| 'env'
	| 'credentials'
	| 'proxy'
	| 'proxyMode'
	| 'capabilities'
	| 'tags'
	| 'labels'
	| 'options'
	| 'extensions'
	| 'enabled';
export type AiEndpointEditorSection = 'identity' | 'connection' | 'routing' | 'metadata';
export type AiEndpointEditorMessages = AiResourceEditorMessages<AiEndpointEditorField, AiEndpointEditorSection>;
export type AiEndpointEditorMessageOverrides = AiResourceEditorMessageOverrides<
	AiEndpointEditorField,
	AiEndpointEditorSection
>;

export type AiEndpointEditorProps = Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'title'> & {
	value: Endpoint;
	onChange: (value: Endpoint) => void;
	onSubmit?: (value: Endpoint) => void;
	schema?: AiConfigSchema<Endpoint>;
	validationMode?: AiConfigValidationMode;
	disabled?: boolean;
	readOnly?: boolean;
	messages?: AiEndpointEditorMessageOverrides;
	slots?: AiConfigEditorSlots<Endpoint>;
	providerOptions?: readonly AiConfigEditorOption[];
	apiTypeOptions?: readonly AiConfigEditorOption[];
};
