'use client';

import { DefaultApiRegistry, type Endpoint, EndpointSchema } from '@wener/ai/schema';
import type { ReactNode } from 'react';
import {
	AiConfigEditor,
	AiConfigFieldGrid,
	AiConfigFieldSlot,
	AiConfigFormSection,
	AiConfigKeyValueField,
	AiConfigSecretField,
	AiConfigSelectField,
	AiConfigStringListField,
	AiConfigTextareaField,
	AiConfigTextField,
	AiConfigToggleField,
	aiConfigFieldError,
	JsonValueEditor,
	mergeResourceEditorMessages,
	useAiConfigDraft,
} from '../../ui/ai-config-editor';
import type {
	AiEndpointEditorField,
	AiEndpointEditorMessages,
	AiEndpointEditorProps,
} from './ai-endpoint-editor-types';

export const defaultAiEndpoint: Endpoint = EndpointSchema.parse({
	id: 'endpoint-new',
	name: 'endpoint-new',
	enabled: true,
});

const defaultApiTypeOptions = DefaultApiRegistry.apiTypes.map((apiType) => ({
	value: apiType.name,
	label: apiType.name,
	description: apiType.family.name,
}));

const defaultMessages: AiEndpointEditorMessages = {
	title: 'AI Endpoint 配置',
	description: '编辑独立 Endpoint 的归属、连接、凭据、路由能力和扩展配置。',
	sections: {
		identity: '身份与归属',
		connection: '连接与凭据',
		routing: '路由与能力',
		metadata: '元数据与扩展',
	},
	fields: {
		id: 'ID',
		name: '名称',
		providerId: 'Provider 归属',
		key: 'Endpoint Key',
		title: '显示名称',
		description: '描述',
		apiType: 'API 类型',
		baseUrl: 'Base URL',
		apiKey: 'API Key',
		headers: '请求头',
		env: '环境变量值',
		credentials: 'Credentials',
		proxy: '启用代理',
		proxyMode: '代理模式',
		capabilities: '能力',
		tags: '标签',
		labels: 'Labels',
		options: 'Options',
		extensions: 'Extensions',
		enabled: '启用 Endpoint',
	},
};

export function AiEndpointEditor({
	value,
	onChange,
	onSubmit,
	schema = EndpointSchema,
	validationMode,
	disabled = false,
	readOnly = false,
	messages: messageOverrides,
	slots,
	providerOptions = [],
	apiTypeOptions = defaultApiTypeOptions,
	...props
}: AiEndpointEditorProps) {
	const messages = mergeResourceEditorMessages(defaultMessages, messageOverrides);
	const controller = useAiConfigDraft({
		value,
		fallbackValue: defaultAiEndpoint,
		schema,
		onChange,
		onSubmit,
		validationMode,
	});
	const draft = controller.draft;
	const locked = disabled || readOnly;
	const patch = (next: Partial<Endpoint>) => controller.setDraft({ ...draft, ...next });
	const field = (name: AiEndpointEditorField, defaultField: ReactNode) => (
		<AiConfigFieldSlot
			name={name}
			draft={draft}
			disabled={disabled}
			readOnly={readOnly}
			error={aiConfigFieldError(controller.visibleIssues, name)}
			defaultField={defaultField}
			onDraftChange={controller.setDraft}
			slots={slots}
		/>
	);
	return (
		<AiConfigEditor
			{...props}
			title={messages.title}
			description={messages.description}
			controller={controller}
			messages={messages.editor}
			slots={slots}
			disabled={disabled}
			readOnly={readOnly}
			showSubmit={Boolean(onSubmit)}
		>
			<AiConfigFormSection title={messages.sections.identity}>
				<AiConfigFieldGrid>
					{field(
						'id',
						<AiConfigTextField
							required
							label={messages.fields.id}
							value={draft.id}
							error={aiConfigFieldError(controller.visibleIssues, 'id')}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(id) => patch({ id })}
						/>,
					)}
					{field(
						'name',
						<AiConfigTextField
							required
							label={messages.fields.name}
							value={draft.name}
							error={aiConfigFieldError(controller.visibleIssues, 'name')}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(name) => patch({ name })}
						/>,
					)}
					{field(
						'title',
						<AiConfigTextField
							label={messages.fields.title}
							value={draft.title}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(title) => patch({ title: optional(title) })}
						/>,
					)}
					{field(
						'key',
						<AiConfigTextField
							label={messages.fields.key}
							value={draft.key}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(key) => patch({ key: optional(key) })}
						/>,
					)}
					{field(
						'providerId',
						<AiConfigSelectField
							label={messages.fields.providerId}
							value={draft.providerId}
							options={providerOptions}
							disabled={locked}
							onValueChange={(providerId) => patch({ providerId: optional(providerId) })}
						/>,
					)}
				</AiConfigFieldGrid>
				{field(
					'description',
					<AiConfigTextareaField
						wrapperClassName='mt-4'
						label={messages.fields.description}
						value={draft.description}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(description) => patch({ description: optional(description) })}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.connection}>
				<AiConfigFieldGrid>
					{field(
						'apiType',
						<AiConfigSelectField
							label={messages.fields.apiType}
							value={draft.apiType}
							options={apiTypeOptions}
							disabled={locked}
							onValueChange={(apiType) => patch({ apiType: optional(apiType) })}
						/>,
					)}
					{field(
						'baseUrl',
						<AiConfigTextField
							type='url'
							label={messages.fields.baseUrl}
							value={draft.baseUrl}
							placeholder='https://api.example.com/v1'
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(baseUrl) => patch({ baseUrl: optional(baseUrl) })}
						/>,
					)}
				</AiConfigFieldGrid>
				{field(
					'apiKey',
					<AiConfigSecretField
						wrapperClassName='mt-4'
						label={messages.fields.apiKey}
						revealIdentity={value.id}
						value={draft.apiKey}
						placeholder='placeholder-secret'
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(apiKey) => patch({ apiKey: optional(apiKey) })}
					/>,
				)}
				<div className='mt-4 grid min-w-0 gap-4 lg:grid-cols-2'>
					{field(
						'headers',
						<AiConfigKeyValueField
							label={messages.fields.headers}
							value={draft.headers}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(headers) => patch({ headers })}
						/>,
					)}
					{field(
						'env',
						<AiConfigKeyValueField
							label={messages.fields.env}
							value={draft.env}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(env) => patch({ env })}
						/>,
					)}
				</div>
				{field(
					'credentials',
					<JsonValueEditor
						className='mt-4'
						label={messages.fields.credentials}
						value={draft.credentials ?? {}}
						disabled={disabled}
						readOnly={readOnly}
						onChange={(credentials) => patch({ credentials: credentials as Endpoint['credentials'] })}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.routing}>
				<AiConfigFieldGrid>
					{field(
						'proxyMode',
						<AiConfigSelectField
							label={messages.fields.proxyMode}
							value={draft.proxyMode}
							options={[
								{ value: 'direct', label: '直连' },
								{ value: 'proxy', label: '代理' },
							]}
							disabled={locked}
							onValueChange={(proxyMode) =>
								patch({ proxyMode: proxyMode ? (proxyMode as Endpoint['proxyMode']) : undefined })
							}
						/>,
					)}
					{field(
						'proxy',
						<AiConfigToggleField
							label={messages.fields.proxy}
							checked={draft.proxy ?? false}
							disabled={locked}
							onCheckedChange={(proxy) => patch({ proxy })}
						/>,
					)}
				</AiConfigFieldGrid>
				{field(
					'capabilities',
					<AiConfigStringListField
						className='mt-4'
						label={messages.fields.capabilities}
						value={draft.capabilities}
						disabled={disabled}
						readOnly={readOnly}
						onChange={(capabilities) => patch({ capabilities })}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.metadata}>
				<div className='grid min-w-0 gap-4 lg:grid-cols-2'>
					{field(
						'tags',
						<AiConfigStringListField
							label={messages.fields.tags}
							value={draft.tags}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(tags) => patch({ tags })}
						/>,
					)}
					{field(
						'labels',
						<AiConfigKeyValueField
							label={messages.fields.labels}
							value={draft.labels}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(labels) => patch({ labels })}
						/>,
					)}
				</div>
				<div className='mt-4 grid min-w-0 gap-4 lg:grid-cols-2'>
					{field(
						'options',
						<JsonValueEditor
							label={messages.fields.options}
							value={draft.options ?? {}}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(options) => patch({ options: options as Endpoint['options'] })}
						/>,
					)}
					{field(
						'extensions',
						<JsonValueEditor
							label={messages.fields.extensions}
							value={draft.extensions ?? {}}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(extensions) => patch({ extensions: extensions as Endpoint['extensions'] })}
						/>,
					)}
				</div>
				{field(
					'enabled',
					<AiConfigToggleField
						wrapperClassName='mt-4'
						label={messages.fields.enabled}
						checked={draft.enabled ?? true}
						disabled={locked}
						onCheckedChange={(enabled) => patch({ enabled })}
					/>,
				)}
			</AiConfigFormSection>
		</AiConfigEditor>
	);
}

function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
