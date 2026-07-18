'use client';

import { DefaultApiRegistry, type Model, ModelSchema } from '@wener/ai/schema';
import type { ReactNode } from 'react';
import {
	AiConfigEditor,
	AiConfigFieldGrid,
	AiConfigFieldSlot,
	AiConfigFormSection,
	AiConfigKeyValueField,
	AiConfigNumberField,
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
import { AiModelCapabilitiesFields, AiModelCostDefaultFields, AiModelLimitFields } from './ai-model-advanced-fields';
import type { AiModelEditorField, AiModelEditorMessages, AiModelEditorProps } from './ai-model-editor-types';

export const defaultAiModel: Model = ModelSchema.parse({
	id: 'model-new',
	name: 'model-new',
	type: 'chat',
	enabled: true,
});
const apiTypes = DefaultApiRegistry.apiTypes.map((item) => ({ value: item.name, label: item.name }));
const families = DefaultApiRegistry.families.map((item) => ({ value: item.name, label: item.name }));
const modelTypes = ['chat', 'completion', 'embedding', 'rerank', 'generation', 'image', 'audio', 'video'].map(
	(value) => ({ value, label: value }),
);
const statuses = ['alpha', 'beta', 'active', 'deprecated', 'disabled'].map((value) => ({ value, label: value }));

const defaultMessages: AiModelEditorMessages = {
	title: 'AI Model 配置',
	description: '绑定 Provider/Endpoint，并配置模型能力、限制、成本和默认参数。',
	sections: {
		identity: '身份',
		binding: 'Provider 与 API 绑定',
		limits: '上下文与 Token 限制',
		modalities: '输入输出模态',
		capabilities: '能力',
		costDefaults: '成本与默认参数',
		metadata: '状态、标签与扩展',
	},
	fields: {
		id: 'ID',
		name: '名称',
		title: '显示名称',
		description: '描述',
		providerId: 'Provider',
		endpointId: 'Endpoint',
		endpointKey: 'Endpoint Key',
		type: '模型类型',
		family: 'API Family',
		apiType: 'API 类型',
		contextWindow: 'Context Window',
		maxInputTokens: '最大输入 Token',
		maxOutputTokens: '最大输出 Token',
		modalities: '模态',
		capabilities: '能力',
		limits: '高级限制',
		cost: '成本',
		defaults: '默认参数',
		status: '状态',
		releaseDate: '发布日期',
		knowledge: '知识截止/说明',
		openWeights: '开放权重',
		headers: '请求头',
		tags: '标签',
		labels: 'Labels',
		options: 'Options',
		extensions: 'Extensions',
		enabled: '启用 Model',
	},
};

export function AiModelEditor({
	value,
	onChange,
	onSubmit,
	schema = ModelSchema,
	validationMode,
	disabled = false,
	readOnly = false,
	messages: overrides,
	slots,
	providerOptions = [],
	endpointOptions = [],
	apiTypeOptions = apiTypes,
	...props
}: AiModelEditorProps) {
	const messages = mergeResourceEditorMessages(defaultMessages, overrides);
	const controller = useAiConfigDraft({
		value,
		fallbackValue: defaultAiModel,
		schema,
		onChange,
		onSubmit,
		validationMode,
	});
	const draft = controller.draft;
	const locked = disabled || readOnly;
	const patch = (next: Partial<Model>) => controller.setDraft({ ...draft, ...next });
	const field = (name: AiModelEditorField, defaultField: ReactNode) => (
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
						<AiConfigSelectField
							label={messages.fields.type}
							value={draft.type}
							options={modelTypes}
							disabled={locked}
							onValueChange={(type) => patch({ type: type ? (type as Model['type']) : undefined })}
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
			<AiConfigFormSection title={messages.sections.binding}>
				<AiConfigFieldGrid>
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
						'endpointId',
						<AiConfigSelectField
							label={messages.fields.endpointId}
							value={draft.endpointId}
							options={endpointOptions}
							disabled={locked}
							onValueChange={(endpointId) => patch({ endpointId: optional(endpointId) })}
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
					{field(
						'family',
						<AiConfigSelectField
							label={messages.fields.family}
							value={draft.family}
							options={families}
							disabled={locked}
							onValueChange={(family) => patch({ family: optional(family) })}
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
				</AiConfigFieldGrid>
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.limits}>
				<AiConfigFieldGrid>
					{field(
						'contextWindow',
						<AiConfigNumberField
							label={messages.fields.contextWindow}
							value={draft.contextWindow}
							integer
							min={1}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(contextWindow) => patch({ contextWindow })}
						/>,
					)}
					{field(
						'maxInputTokens',
						<AiConfigNumberField
							label={messages.fields.maxInputTokens}
							value={draft.maxInputTokens}
							integer
							min={1}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(maxInputTokens) => patch({ maxInputTokens })}
						/>,
					)}
					{field(
						'maxOutputTokens',
						<AiConfigNumberField
							label={messages.fields.maxOutputTokens}
							value={draft.maxOutputTokens}
							integer
							min={1}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(maxOutputTokens) => patch({ maxOutputTokens })}
						/>,
					)}
				</AiConfigFieldGrid>
				<div className='mt-4'>
					{field(
						'limits',
						<AiModelLimitFields value={draft} onChange={controller.setDraft} disabled={disabled} readOnly={readOnly} />,
					)}
				</div>
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.modalities}>
				<div className='grid gap-4 lg:grid-cols-2'>
					{field(
						'modalities',
						<AiConfigStringListField
							label='输入模态'
							value={draft.modalities?.input ?? []}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(input) => patch({ modalities: { ...draft.modalities, input } })}
						/>,
					)}
					<AiConfigStringListField
						label='输出模态'
						value={draft.modalities?.output ?? []}
						disabled={disabled}
						readOnly={readOnly}
						onChange={(output) => patch({ modalities: { ...draft.modalities, output } })}
					/>
				</div>
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.capabilities}>
				{field(
					'capabilities',
					<AiModelCapabilitiesFields
						value={draft}
						onChange={controller.setDraft}
						disabled={disabled}
						readOnly={readOnly}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.costDefaults}>
				{field(
					'cost',
					<AiModelCostDefaultFields
						value={draft}
						onChange={controller.setDraft}
						disabled={disabled}
						readOnly={readOnly}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.metadata}>
				<AiConfigFieldGrid>
					{field(
						'status',
						<AiConfigSelectField
							label={messages.fields.status}
							value={draft.status}
							options={statuses}
							disabled={locked}
							onValueChange={(status) => patch({ status: status ? (status as Model['status']) : undefined })}
						/>,
					)}
					{field(
						'releaseDate',
						<AiConfigTextField
							type='date'
							label={messages.fields.releaseDate}
							value={draft.releaseDate}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(releaseDate) => patch({ releaseDate: optional(releaseDate) })}
						/>,
					)}
					{field(
						'knowledge',
						<AiConfigTextField
							label={messages.fields.knowledge}
							value={draft.knowledge}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(knowledge) => patch({ knowledge: optional(knowledge) })}
						/>,
					)}
					{field(
						'openWeights',
						<AiConfigToggleField
							label={messages.fields.openWeights}
							checked={draft.openWeights ?? false}
							disabled={locked}
							onCheckedChange={(openWeights) => patch({ openWeights })}
						/>,
					)}
				</AiConfigFieldGrid>
				<div className='mt-4 grid gap-4 lg:grid-cols-2'>
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
					'tags',
					<AiConfigStringListField
						className='mt-4'
						label={messages.fields.tags}
						value={draft.tags}
						disabled={disabled}
						readOnly={readOnly}
						onChange={(tags) => patch({ tags })}
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
							onChange={(options) => patch({ options: options as Model['options'] })}
						/>,
					)}
					{field(
						'extensions',
						<JsonValueEditor
							label={messages.fields.extensions}
							value={draft.extensions ?? {}}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(extensions) => patch({ extensions: extensions as Model['extensions'] })}
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
