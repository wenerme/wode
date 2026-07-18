'use client';

import { DefaultApiRegistry, type Service, ServiceSchema } from '@wener/ai/schema';
import type { ReactNode } from 'react';
import {
	AiConfigEditor,
	AiConfigFieldGrid,
	AiConfigFieldSlot,
	AiConfigFormSection,
	AiConfigKeyValueField,
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
import { AiServiceAuthenticationFields } from './ai-service-authentication-fields';
import type { AiServiceEditorField, AiServiceEditorMessages, AiServiceEditorProps } from './ai-service-editor-types';

export const defaultAiService: Service = ServiceSchema.parse({
	id: 'service-new',
	name: 'service-new',
	type: 'ai',
	enabled: true,
});
const apiTypes = DefaultApiRegistry.apiTypes.map((item) => ({ value: item.name, label: item.name }));
const defaultMessages: AiServiceEditorMessages = {
	title: 'AI Service 配置',
	description: '配置 Agent 可消费的服务连接、认证和能力。',
	sections: {
		identity: '身份',
		connection: 'Endpoint 连接',
		authentication: '认证与凭据',
		capabilities: '能力',
		metadata: '标签与扩展',
	},
	fields: {
		id: 'ID',
		name: '名称',
		title: '显示名称',
		description: '描述',
		type: '服务类型',
		apiType: 'API 类型',
		stage: '阶段',
		environment: '环境',
		env: '环境配置',
		baseUrl: 'Base URL',
		host: 'Host',
		port: 'Port',
		providerId: 'Provider 引用',
		endpoints: 'Endpoint 引用',
		defaultEndpointId: '默认 Endpoint',
		endpointKey: 'Endpoint Key',
		apiKey: 'API Key',
		username: '用户名',
		password: '密码',
		headers: '请求头',
		auth: 'Auth 配置',
		credentials: 'Credentials',
		capabilities: '能力',
		tags: '标签',
		labels: 'Labels',
		notes: '备注',
		options: 'Options',
		extensions: 'Extensions',
		enabled: '启用 Service',
	},
};

export function AiServiceEditor({
	value,
	onChange,
	onSubmit,
	schema = ServiceSchema,
	validationMode,
	disabled = false,
	readOnly = false,
	messages: overrides,
	slots,
	apiTypeOptions = apiTypes,
	providerOptions = [],
	endpointOptions = [],
	...props
}: AiServiceEditorProps) {
	const messages = mergeResourceEditorMessages(defaultMessages, overrides);
	const controller = useAiConfigDraft({
		value,
		fallbackValue: defaultAiService,
		schema,
		onChange,
		onSubmit,
		validationMode,
	});
	const draft = controller.draft;
	const locked = disabled || readOnly;
	const patch = (next: Partial<Service>) => controller.setDraft({ ...draft, ...next });
	const field = (name: AiServiceEditorField, defaultField: ReactNode) => (
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
						'type',
						<AiConfigTextField
							label={messages.fields.type}
							value={draft.type}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(type) => patch({ type: optional(type) })}
						/>,
					)}
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
						'stage',
						<AiConfigTextField
							label={messages.fields.stage}
							value={draft.stage}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(stage) => patch({ stage: optional(stage) })}
						/>,
					)}
					{field(
						'environment',
						<AiConfigTextField
							label={messages.fields.environment}
							value={draft.environment}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(environment) => patch({ environment: optional(environment) })}
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
						'baseUrl',
						<AiConfigTextField
							type='url'
							label={messages.fields.baseUrl}
							value={draft.baseUrl}
							placeholder='https://service.example.com'
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(baseUrl) => patch({ baseUrl: optional(baseUrl) })}
						/>,
					)}
					{field(
						'host',
						<AiConfigTextField
							label={messages.fields.host}
							value={draft.host}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(host) => patch({ host: optional(host) })}
						/>,
					)}
					{field(
						'port',
						<AiConfigTextField
							label={messages.fields.port}
							value={draft.port === undefined ? '' : String(draft.port)}
							inputMode='numeric'
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(port) => patch({ port: parseServicePort(port) })}
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
					{field(
						'defaultEndpointId',
						<AiConfigSelectField
							label={messages.fields.defaultEndpointId}
							value={draft.defaultEndpointId}
							options={endpointOptions}
							disabled={locked}
							onValueChange={(defaultEndpointId) => patch({ defaultEndpointId: optional(defaultEndpointId) })}
						/>,
					)}
					{field(
						'endpointKey',
						<AiConfigTextField
							label={messages.fields.endpointKey}
							value={draft.endpointKey}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(endpointKey) => patch({ endpointKey: optional(endpointKey) })}
						/>,
					)}
				</AiConfigFieldGrid>
				{field(
					'endpoints',
					<AiConfigStringListField
						className='mt-4'
						label={messages.fields.endpoints}
						value={draft.endpoints}
						disabled={disabled}
						readOnly={readOnly}
						onChange={(endpoints) => patch({ endpoints })}
					/>,
				)}
				{field(
					'env',
					typeof draft.env === 'string' || draft.env === undefined ? (
						<AiConfigTextField
							wrapperClassName='mt-4'
							label={messages.fields.env}
							value={draft.env}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(env) => patch({ env: optional(env) })}
						/>
					) : (
						<AiConfigKeyValueField
							className='mt-4'
							label={messages.fields.env}
							value={draft.env}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(env) => patch({ env })}
						/>
					),
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.authentication}>
				<AiServiceAuthenticationFields
					value={draft}
					onChange={controller.setDraft}
					labels={messages.fields}
					disabled={disabled}
					readOnly={readOnly}
					revealIdentity={value.id}
					renderField={field}
				/>
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.capabilities}>
				{field(
					'capabilities',
					<AiConfigStringListField
						label={messages.fields.capabilities}
						value={draft.capabilities}
						disabled={disabled}
						readOnly={readOnly}
						onChange={(capabilities) => patch({ capabilities })}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.metadata}>
				<div className='grid gap-4 lg:grid-cols-2'>
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
				{field(
					'notes',
					<AiConfigTextareaField
						wrapperClassName='mt-4'
						label={messages.fields.notes}
						value={draft.notes}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(notes) => patch({ notes: optional(notes) })}
					/>,
				)}
				<div className='mt-4 grid gap-4 lg:grid-cols-2'>
					{field(
						'options',
						<JsonValueEditor
							label={messages.fields.options}
							value={draft.options ?? {}}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(options) => patch({ options: options as Service['options'] })}
						/>,
					)}
					{field(
						'extensions',
						<JsonValueEditor
							label={messages.fields.extensions}
							value={draft.extensions ?? {}}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(extensions) => patch({ extensions: extensions as Service['extensions'] })}
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

export function parseServicePort(value: string): number | string | undefined {
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	if (/^[1-9]\d*$/u.test(trimmed)) {
		const numeric = Number(trimmed);
		if (Number.isSafeInteger(numeric)) return numeric;
	}
	return trimmed;
}

function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
