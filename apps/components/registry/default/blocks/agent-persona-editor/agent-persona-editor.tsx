'use client';

import { type Persona, PersonaSchema } from '@wener/ai/agent/persona';
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
	AgentPersonaEditorField,
	AgentPersonaEditorMessages,
	AgentPersonaEditorProps,
} from './agent-persona-editor-types';
import { PersonaAssetsEditor } from './persona-assets-editor';
import { PersonaAuthoringFields, PersonaPromptFields } from './persona-authoring-fields';
import { PersonaGovernanceFields } from './persona-governance-fields';
import { PersonaLorebookEditor } from './persona-lorebook-editor';

export const defaultAgentPersona: Persona = PersonaSchema.parse({
	id: 'persona-new',
	name: '新角色',
	version: '1.0.0',
});
const defaultMessages: AgentPersonaEditorMessages = {
	title: 'Agent Persona 配置',
	description: '编辑角色 authoring、prompts、Lorebook、资源 manifest 与治理信息。',
	sections: {
		identity: '身份',
		authoring: '性格与行为',
		prompts: 'Prompts 与问候语',
		author: '作者',
		lorebook: 'Lorebook',
		assets: '资源 Manifest',
		governance: '来源、治理与权利',
		extensions: 'Metadata 与 Extensions',
	},
	fields: {
		id: 'ID',
		name: '名称',
		version: '版本',
		title: '显示名称',
		nickname: '昵称',
		description: '描述',
		author: '作者',
		creatorNotes: '创作者备注',
		tags: '标签',
		language: '语言',
		authoring: 'Authoring',
		prompts: 'Prompts',
		greetings: '问候语',
		groupGreetings: '群组问候语',
		lorebook: 'Lorebook',
		assets: '资源',
		governance: '治理',
		rights: 'Rights',
		metadata: 'Metadata',
		extensions: 'Extensions',
	},
};

export function AgentPersonaEditor({
	value,
	onChange,
	onSubmit,
	schema = PersonaSchema,
	validationMode,
	disabled = false,
	readOnly = false,
	messages: overrides,
	slots,
	maxLoreEntries = 64,
	maxAssets = 64,
	...props
}: AgentPersonaEditorProps) {
	const messages = mergeResourceEditorMessages(defaultMessages, overrides);
	const controller = useAiConfigDraft({
		value,
		fallbackValue: defaultAgentPersona,
		schema,
		onChange,
		onSubmit,
		validationMode,
	});
	const draft = controller.draft;
	const patch = (next: Partial<Persona>) => controller.setDraft({ ...draft, ...next });
	const field = (name: AgentPersonaEditorField, defaultField: ReactNode) => (
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
						'nickname',
						<AiConfigTextField
							label={messages.fields.nickname}
							value={draft.nickname}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(nickname) => patch({ nickname: optional(nickname) })}
						/>,
					)}
					{field(
						'language',
						<AiConfigTextField
							label={messages.fields.language}
							value={draft.language}
							placeholder='zh-CN'
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(language) => patch({ language: optional(language) })}
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
			<AiConfigFormSection title={messages.sections.authoring}>
				{field(
					'authoring',
					<PersonaAuthoringFields
						value={draft}
						onChange={controller.setDraft}
						disabled={disabled}
						readOnly={readOnly}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.prompts}>
				{field(
					'prompts',
					<PersonaPromptFields value={draft} onChange={controller.setDraft} disabled={disabled} readOnly={readOnly} />,
				)}
				<div className='mt-4 grid gap-4 lg:grid-cols-2'>
					{field(
						'greetings',
						<AiConfigStringListField
							label={messages.fields.greetings}
							value={draft.greetings}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(greetings) => patch({ greetings })}
						/>,
					)}
					{field(
						'groupGreetings',
						<AiConfigStringListField
							label={messages.fields.groupGreetings}
							value={draft.groupGreetings}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(groupGreetings) => patch({ groupGreetings })}
						/>,
					)}
				</div>
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.author}>
				<AiConfigFieldGrid>
					<AiConfigTextField
						label='作者名称'
						value={draft.author?.name}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(name) => patch({ author: name.trim() ? { ...draft.author, name } : undefined })}
					/>
					<AiConfigTextField
						label='作者 ID'
						value={draft.author?.id}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(id) => draft.author && patch({ author: { ...draft.author, id: optional(id) } })}
					/>
					<AiConfigTextField
						type='url'
						label='作者 URL'
						value={draft.author?.url}
						placeholder='https://example.com/author'
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(url) => draft.author && patch({ author: { ...draft.author, url: optional(url) } })}
					/>
					<AiConfigTextField
						label='联系方式'
						value={draft.author?.contact}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(contact) =>
							draft.author && patch({ author: { ...draft.author, contact: optional(contact) } })
						}
					/>
				</AiConfigFieldGrid>
				{field(
					'creatorNotes',
					<AiConfigTextareaField
						wrapperClassName='mt-4'
						label={messages.fields.creatorNotes}
						value={draft.creatorNotes}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(creatorNotes) => patch({ creatorNotes: optional(creatorNotes) })}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.lorebook}>
				{field(
					'lorebook',
					<PersonaLorebookEditor
						value={draft.lorebook}
						maxEntries={maxLoreEntries}
						disabled={disabled}
						readOnly={readOnly}
						onChange={(lorebook) => patch({ lorebook })}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.assets}>
				{field(
					'assets',
					<PersonaAssetsEditor
						value={draft.assets}
						maxAssets={maxAssets}
						disabled={disabled}
						readOnly={readOnly}
						onChange={(assets) => patch({ assets })}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.governance}>
				{field(
					'governance',
					<PersonaGovernanceFields
						value={draft}
						onChange={controller.setDraft}
						disabled={disabled}
						readOnly={readOnly}
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
							onChange={(metadata) => patch({ metadata: metadata as Persona['metadata'] })}
						/>,
					)}
					{field(
						'extensions',
						<JsonValueEditor
							label={messages.fields.extensions}
							value={draft.extensions ?? {}}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(extensions) => patch({ extensions: extensions as Persona['extensions'] })}
						/>,
					)}
				</div>
			</AiConfigFormSection>
		</AiConfigEditor>
	);
}

function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
