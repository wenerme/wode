'use client';

import { type McpServerConfig, McpServerConfigSchema, type McpTransport } from '@wener/ai/mcp';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import {
	AiConfigEditor,
	type AiConfigEditorSlots,
	AiConfigFieldGrid,
	AiConfigFieldSlot,
	AiConfigFormSection,
	AiConfigKeyValueField,
	AiConfigNumberField,
	type AiConfigSchema,
	AiConfigStringListField,
	AiConfigTextareaField,
	AiConfigTextField,
	AiConfigToggleField,
	type AiConfigValidationMode,
	type AiResourceEditorMessageOverrides,
	type AiResourceEditorMessages,
	aiConfigFieldError,
	JsonValueEditor,
	mergeResourceEditorMessages,
	useAiConfigDraft,
} from '../../ui/ai-config-editor';

export type McpServerEditorField =
	| 'id'
	| 'name'
	| 'title'
	| 'description'
	| 'transport'
	| 'url'
	| 'headers'
	| 'command'
	| 'args'
	| 'env'
	| 'cwd'
	| 'timeout'
	| 'timeoutMs'
	| 'options'
	| 'tags'
	| 'metadata'
	| 'extensions'
	| 'enabled';
export type McpServerEditorSection = 'identity' | 'transport' | 'runtime' | 'metadata';
export type McpServerEditorMessages = AiResourceEditorMessages<McpServerEditorField, McpServerEditorSection>;
export type McpServerEditorMessageOverrides = AiResourceEditorMessageOverrides<
	McpServerEditorField,
	McpServerEditorSection
>;
export type McpServerEditorProps = Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'title'> & {
	value: McpServerConfig;
	onChange: (value: McpServerConfig) => void;
	onSubmit?: (value: McpServerConfig) => void;
	schema?: AiConfigSchema<McpServerConfig>;
	validationMode?: AiConfigValidationMode;
	disabled?: boolean;
	readOnly?: boolean;
	messages?: McpServerEditorMessageOverrides;
	slots?: AiConfigEditorSlots<McpServerConfig>;
};

export const defaultMcpServer: McpServerConfig = McpServerConfigSchema.parse({
	id: 'mcp-new',
	name: 'mcp-new',
	transport: 'streamable-http',
	url: 'https://example.com/mcp',
	enabled: true,
});
const defaultMessages: McpServerEditorMessages = {
	title: 'MCP Server 配置',
	description: '在 HTTP、SSE 与本地 stdio transport 之间切换。',
	sections: { identity: '身份', transport: 'Transport', runtime: '运行参数', metadata: '标签与扩展' },
	fields: {
		id: 'ID',
		name: '名称',
		title: '显示名称',
		description: '描述',
		transport: 'Transport',
		url: 'Server URL',
		headers: '请求头',
		command: '命令',
		args: '参数',
		env: '环境变量',
		cwd: '工作目录',
		timeout: '超时（秒）',
		timeoutMs: '超时（毫秒）',
		options: 'Options',
		tags: '标签',
		metadata: 'Metadata',
		extensions: 'Extensions',
		enabled: '启用 MCP Server',
	},
};

export function McpServerEditor({
	value,
	onChange,
	onSubmit,
	schema = McpServerConfigSchema,
	validationMode,
	disabled = false,
	readOnly = false,
	messages: overrides,
	slots,
	...props
}: McpServerEditorProps) {
	const messages = mergeResourceEditorMessages(defaultMessages, overrides);
	const controller = useAiConfigDraft({
		value,
		fallbackValue: defaultMcpServer,
		schema,
		onChange,
		onSubmit,
		validationMode,
	});
	const draft = controller.draft;
	const locked = disabled || readOnly;
	const patch = (next: Partial<McpServerConfig>) => controller.setDraft({ ...draft, ...next } as McpServerConfig);
	const field = (name: McpServerEditorField, defaultField: ReactNode) => (
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
							onValueChange={(name) => patch({ name: optional(name) })}
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
			<AiConfigFormSection title={messages.sections.transport}>
				{field(
					'transport',
					<TransportSwitch
						value={draft.transport}
						disabled={locked}
						label={messages.fields.transport}
						onChange={(transport) => controller.setDraft(changeMcpTransport(draft, transport))}
					/>,
				)}
				{draft.transport === 'stdio' ? (
					<AiConfigFieldGrid className='mt-4'>
						{field(
							'command',
							<AiConfigTextField
								required
								label={messages.fields.command}
								value={draft.command}
								disabled={disabled}
								readOnly={readOnly}
								onValueChange={(command) => patch({ command: optional(command) })}
							/>,
						)}
						{field(
							'cwd',
							<AiConfigTextField
								label={messages.fields.cwd}
								value={draft.cwd}
								disabled={disabled}
								readOnly={readOnly}
								onValueChange={(cwd) => patch({ cwd: optional(cwd) })}
							/>,
						)}
						{field(
							'args',
							<AiConfigStringListField
								label={messages.fields.args}
								value={draft.args}
								disabled={disabled}
								readOnly={readOnly}
								onChange={(args) => patch({ args })}
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
					</AiConfigFieldGrid>
				) : (
					<div className='mt-4 grid gap-4 lg:grid-cols-2'>
						{field(
							'url',
							<AiConfigTextField
								type='url'
								required
								label={messages.fields.url}
								value={draft.url}
								placeholder='https://example.com/mcp'
								disabled={disabled}
								readOnly={readOnly}
								onValueChange={(url) => patch({ url: optional(url) })}
							/>,
						)}
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
					</div>
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.runtime}>
				<AiConfigFieldGrid>
					{field(
						'timeout',
						<AiConfigNumberField
							label={messages.fields.timeout}
							value={draft.timeout}
							integer
							min={1}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(timeout) => patch({ timeout })}
						/>,
					)}
					{field(
						'timeoutMs',
						<AiConfigNumberField
							label={messages.fields.timeoutMs}
							value={draft.timeoutMs}
							integer
							min={1}
							disabled={disabled}
							readOnly={readOnly}
							onValueChange={(timeoutMs) => patch({ timeoutMs })}
						/>,
					)}
				</AiConfigFieldGrid>
				{field(
					'options',
					<JsonValueEditor
						className='mt-4'
						label={messages.fields.options}
						value={draft.options ?? {}}
						disabled={disabled}
						readOnly={readOnly}
						onChange={(options) => patch({ options: options as McpServerConfig['options'] })}
					/>,
				)}
			</AiConfigFormSection>
			<AiConfigFormSection title={messages.sections.metadata}>
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
				<div className='mt-4 grid gap-4 lg:grid-cols-2'>
					{field(
						'metadata',
						<JsonValueEditor
							label={messages.fields.metadata}
							value={draft.metadata ?? {}}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(metadata) => patch({ metadata: metadata as McpServerConfig['metadata'] })}
						/>,
					)}
					{field(
						'extensions',
						<JsonValueEditor
							label={messages.fields.extensions}
							value={draft.extensions ?? {}}
							disabled={disabled}
							readOnly={readOnly}
							onChange={(extensions) => patch({ extensions: extensions as McpServerConfig['extensions'] })}
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

export function changeMcpTransport(value: McpServerConfig, transport: McpTransport): McpServerConfig {
	const shared = {
		id: value.id,
		name: value.name,
		title: value.title,
		description: value.description,
		transport,
		timeout: value.timeout,
		timeoutMs: value.timeoutMs,
		options: value.options,
		tags: value.tags,
		metadata: value.metadata,
		extensions: value.extensions,
		enabled: value.enabled,
	};
	if (transport === 'stdio')
		return McpServerConfigSchema.parse({
			...shared,
			command: value.transport === 'stdio' ? value.command : 'node',
			args: value.transport === 'stdio' ? value.args : [],
			env: value.transport === 'stdio' ? value.env : {},
			cwd: value.transport === 'stdio' ? value.cwd : undefined,
		});
	return McpServerConfigSchema.parse({
		...shared,
		url: value.transport === 'stdio' ? 'https://example.com/mcp' : value.url,
		headers: value.transport === 'stdio' ? {} : value.headers,
	});
}

function TransportSwitch({
	value,
	onChange,
	label,
	disabled,
}: {
	value: McpTransport;
	onChange: (value: McpTransport) => void;
	label: string;
	disabled: boolean;
}) {
	return (
		<div>
			<span className='mb-1 block text-sm font-medium'>{label}</span>
			<div className='join' role='radiogroup' aria-label={label}>
				{(['streamable-http', 'sse', 'stdio'] as const).map((transport) => (
					<button
						key={transport}
						type='button'
						role='radio'
						aria-checked={value === transport}
						className={`btn btn-sm join-item ${value === transport ? 'btn-active' : 'btn-outline'}`}
						disabled={disabled}
						onClick={() => onChange(transport)}
					>
						{transport}
					</button>
				))}
			</div>
		</div>
	);
}

function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
