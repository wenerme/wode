'use client';

import type { SkillContextRequirement, SkillToolRequirement } from '@wener/ai/agent/skill';
import { Plus, Trash2 } from 'lucide-react';
import {
	AiConfigFieldGrid,
	AiConfigSelectField,
	AiConfigStringListField,
	AiConfigTextareaField,
	AiConfigTextField,
	AiConfigToggleField,
	JsonValueEditor,
	useStableListEntries,
} from '../../ui/ai-config-editor';

const contextKinds = ['agents', 'file', 'directory', 'environment', 'capability', 'service', 'other'].map((value) => ({
	value,
	label: value,
}));
export type SkillRequirementsEditorProps = {
	tools: readonly SkillToolRequirement[];
	contexts: readonly SkillContextRequirement[];
	onToolsChange: (value: SkillToolRequirement[]) => void;
	onContextsChange: (value: SkillContextRequirement[]) => void;
	disabled?: boolean;
	readOnly?: boolean;
	maxTools?: number;
	maxContexts?: number;
};

export function SkillRequirementsEditor({
	tools,
	contexts,
	onToolsChange,
	onContextsChange,
	disabled = false,
	readOnly = false,
	maxTools = 64,
	maxContexts = 64,
}: SkillRequirementsEditorProps) {
	const toolMax = bound(maxTools);
	const contextMax = bound(maxContexts);
	const toolEntries = useStableListEntries(tools, 'tool-requirement');
	const contextEntries = useStableListEntries(contexts, 'context-requirement');
	return (
		<div className='grid min-w-0 gap-6 xl:grid-cols-2'>
			<div className='min-w-0 space-y-3'>
				<ListHeader
					title='工具要求'
					count={tools.length}
					max={toolMax}
					disabled={disabled || readOnly || tools.length >= toolMax}
					onAdd={() => onToolsChange([...tools, createToolRequirement(tools)])}
				/>
				<div className='divide-base-300 border-base-300 divide-y border-y'>
					{tools.length ? (
						toolEntries.map(({ item: tool, key }, index) => (
							<details key={key} className='py-3' open={index === 0}>
								<summary className='cursor-pointer list-none truncate text-sm font-medium'>{tool.name}</summary>
								<div className='mt-3 space-y-3 ps-2'>
									<AiConfigTextField
										required
										label='工具名称'
										value={tool.name}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(name) => onToolsChange(replace(tools, index, { ...tool, name }))}
									/>
									<AiConfigTextareaField
										label='描述'
										value={tool.description}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(description) =>
											onToolsChange(replace(tools, index, { ...tool, description: optional(description) }))
										}
									/>
									<AiConfigStringListField
										label='所需能力'
										value={tool.capabilities}
										disabled={disabled}
										readOnly={readOnly}
										onChange={(capabilities) => onToolsChange(replace(tools, index, { ...tool, capabilities }))}
									/>
									<AiConfigToggleField
										label='必需'
										checked={tool.required ?? true}
										disabled={disabled || readOnly}
										onCheckedChange={(required) => onToolsChange(replace(tools, index, { ...tool, required }))}
									/>
									<JsonValueEditor
										label='工具配置'
										value={tool.configuration ?? {}}
										disabled={disabled}
										readOnly={readOnly}
										onChange={(configuration) =>
											onToolsChange(
												replace(tools, index, {
													...tool,
													configuration: configuration as SkillToolRequirement['configuration'],
												}),
											)
										}
									/>
									{!readOnly ? (
										<RemoveButton
											disabled={disabled}
											label='删除工具要求'
											onClick={() => onToolsChange(tools.filter((_, itemIndex) => itemIndex !== index))}
										/>
									) : null}
								</div>
							</details>
						))
					) : (
						<Empty label='暂无工具要求' />
					)}
				</div>
			</div>
			<div className='min-w-0 space-y-3'>
				<ListHeader
					title='上下文要求'
					count={contexts.length}
					max={contextMax}
					disabled={disabled || readOnly || contexts.length >= contextMax}
					onAdd={() => onContextsChange([...contexts, createContextRequirement(contexts)])}
				/>
				<div className='divide-base-300 border-base-300 divide-y border-y'>
					{contexts.length ? (
						contextEntries.map(({ item: context, key }, index) => (
							<details key={key} className='py-3' open={index === 0}>
								<summary className='cursor-pointer list-none truncate text-sm font-medium'>
									{context.kind}: {context.value}
								</summary>
								<div className='mt-3 space-y-3 ps-2'>
									<AiConfigFieldGrid>
										<AiConfigSelectField
											required
											label='类型'
											value={context.kind}
											options={contextKinds}
											disabled={disabled || readOnly}
											onValueChange={(kind) =>
												onContextsChange(
													replace(contexts, index, { ...context, kind: kind as SkillContextRequirement['kind'] }),
												)
											}
										/>
										<AiConfigTextField
											required
											label='值'
											value={context.value}
											disabled={disabled}
											readOnly={readOnly}
											onValueChange={(nextValue) =>
												onContextsChange(replace(contexts, index, { ...context, value: nextValue }))
											}
										/>
									</AiConfigFieldGrid>
									<AiConfigTextareaField
										label='描述'
										value={context.description}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(description) =>
											onContextsChange(replace(contexts, index, { ...context, description: optional(description) }))
										}
									/>
									<AiConfigToggleField
										label='必需'
										checked={context.required ?? true}
										disabled={disabled || readOnly}
										onCheckedChange={(required) => onContextsChange(replace(contexts, index, { ...context, required }))}
									/>
									{!readOnly ? (
										<RemoveButton
											disabled={disabled}
											label='删除上下文要求'
											onClick={() => onContextsChange(contexts.filter((_, itemIndex) => itemIndex !== index))}
										/>
									) : null}
								</div>
							</details>
						))
					) : (
						<Empty label='暂无上下文要求' />
					)}
				</div>
			</div>
		</div>
	);
}

function ListHeader({
	title,
	count,
	max,
	disabled,
	onAdd,
}: {
	title: string;
	count: number;
	max: number;
	disabled: boolean;
	onAdd: () => void;
}) {
	return (
		<div className='flex items-center justify-between gap-2'>
			<div>
				<h4 className='text-sm font-semibold'>{title}</h4>
				<p className='text-base-content/60 text-xs'>
					{count} / {max}
				</p>
			</div>
			<button
				type='button'
				className='btn btn-outline btn-sm'
				aria-label={`添加${title}`}
				disabled={disabled}
				onClick={onAdd}
			>
				<Plus aria-hidden='true' className='size-4' />
				添加
			</button>
		</div>
	);
}
function RemoveButton({ disabled, label, onClick }: { disabled: boolean; label: string; onClick: () => void }) {
	return (
		<div className='flex justify-end'>
			<button type='button' className='btn btn-ghost btn-sm text-error' disabled={disabled} onClick={onClick}>
				<Trash2 aria-hidden='true' className='size-4' />
				{label}
			</button>
		</div>
	);
}
function Empty({ label }: { label: string }) {
	return <div className='text-base-content/55 py-6 text-center text-sm'>{label}</div>;
}
function replace<T>(items: readonly T[], index: number, value: T): T[] {
	return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}
function createToolRequirement(items: readonly SkillToolRequirement[]): SkillToolRequirement {
	let suffix = items.length + 1;
	while (items.some((item) => item.name === `tool-${suffix}`)) suffix++;
	return { name: `tool-${suffix}`, required: true };
}
function createContextRequirement(items: readonly SkillContextRequirement[]): SkillContextRequirement {
	return { kind: 'file', value: `reference-${items.length + 1}.md`, required: true };
}
function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
function bound(value: number): number {
	return Number.isInteger(value) ? Math.max(1, Math.min(value, 256)) : 64;
}
