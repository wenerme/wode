'use client';

import { type Skill, SkillSchema } from '@wener/ai/agent/skill';
import type { ReactNode } from 'react';
import {
	AiConfigEditor,
	AiConfigFieldGrid,
	AiConfigFieldSlot,
	AiConfigFormSection,
	AiConfigStringListField,
	AiConfigTextareaField,
	AiConfigTextField,
	aiConfigFieldError,
	JsonValueEditor,
	mergeResourceEditorMessages,
	useAiConfigDraft,
} from '../../ui/ai-config-editor';
import type {
	AgentSkillEditorField,
	AgentSkillEditorMessages,
	AgentSkillEditorProps,
} from './agent-skill-editor-types';
import { formatSkillMarkdown, SkillMarkdownPreview } from './skill-markdown-preview';
import { SkillRequirementsEditor } from './skill-requirements-editor';
import { SkillResourcesEditor } from './skill-resources-editor';

export const defaultAgentSkill: Skill = SkillSchema.parse({
	name: 'new-skill',
	description: '描述此 Skill 的用途',
	instructions: '在此编写执行指令。',
	version: '1.0.0',
});
const defaultMessages: AgentSkillEditorMessages = {
	title: 'Agent Skill 配置',
	description: '编辑 SKILL.md 对应内容、requirements、resource manifests 与扩展数据。',
	sections: {
		identity: '身份',
		instructions: 'Instructions',
		requirements: '工具与上下文要求',
		resources: '资源 Manifest',
		extensions: 'Metadata 与 Extensions',
		preview: 'SKILL.md 预览',
	},
	fields: {
		id: 'ID',
		name: '名称',
		description: '描述',
		version: '版本',
		instructions: 'Instructions',
		tags: '标签',
		toolRequirements: '工具要求',
		contextRequirements: '上下文要求',
		resources: '资源',
		metadata: 'Metadata',
		extensions: 'Extensions',
		preview: 'SKILL.md 预览',
	},
};

export function AgentSkillEditor({
	value,
	onChange,
	onSubmit,
	schema = SkillSchema,
	validationMode,
	disabled = false,
	readOnly = false,
	messages: overrides,
	slots,
	maxToolRequirements = 64,
	maxContextRequirements = 64,
	maxResources = 64,
	preview: Preview = SkillMarkdownPreview,
	...props
}: AgentSkillEditorProps) {
	const messages = mergeResourceEditorMessages(defaultMessages, overrides);
	const controller = useAiConfigDraft({
		value,
		fallbackValue: defaultAgentSkill,
		schema,
		onChange,
		onSubmit,
		validationMode,
	});
	const draft = controller.draft;
	const patch = (next: Partial<Skill>) => controller.setDraft({ ...draft, ...next });
	const field = (name: AgentSkillEditorField, defaultField: ReactNode) => (
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
							label={messages.fields.id}
							value={draft.id}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(id) => patch({ id: optional(id) })}
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
						'version',
						<AiConfigTextField
							required
							label={messages.fields.version}
							value={draft.version}
							error={aiConfigFieldError(controller.visibleIssues, 'version')}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(version) => patch({ version })}
						/>,
					)}
				</AiConfigFieldGrid>
				{field(
					'description',
					<AiConfigTextareaField
						wrapperClassName='mt-4'
						required
						label={messages.fields.description}
						value={draft.description}
						error={aiConfigFieldError(controller.visibleIssues, 'description')}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(description) => patch({ description })}
					/>,
				)}
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
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.instructions}>
				{field(
					'instructions',
					<AiConfigTextareaField
						required
						label={messages.fields.instructions}
						rows={14}
						value={draft.instructions}
						error={aiConfigFieldError(controller.visibleIssues, 'instructions')}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(instructions) => patch({ instructions })}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.requirements}>
				{field(
					'toolRequirements',
					<SkillRequirementsEditor
						tools={draft.toolRequirements}
						contexts={draft.contextRequirements}
						maxTools={maxToolRequirements}
						maxContexts={maxContextRequirements}
						disabled={disabled}
						readOnly={readOnly}
						onToolsChange={(toolRequirements) => patch({ toolRequirements })}
						onContextsChange={(contextRequirements) => patch({ contextRequirements })}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.resources}>
				{field(
					'resources',
					<SkillResourcesEditor
						value={draft.resources}
						maxResources={maxResources}
						disabled={disabled}
						readOnly={readOnly}
						onChange={(resources) => patch({ resources })}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.extensions}>
				<div className='grid gap-4 lg:grid-cols-2'>
					{field(
						'metadata',
						<JsonValueEditor
							label={messages.fields.metadata}
							value={draft.metadata ?? {}}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(metadata) => patch({ metadata: metadata as Skill['metadata'] })}
						/>,
					)}
					{field(
						'extensions',
						<JsonValueEditor
							label={messages.fields.extensions}
							value={draft.extensions ?? {}}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(extensions) => patch({ extensions: extensions as Skill['extensions'] })}
						/>,
					)}
				</div>
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.preview}>
				{field('preview', <Preview value={draft} markdown={formatSkillMarkdown(draft)} />)}
			</AiConfigFormSection>
		</AiConfigEditor>
	);
}

function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
