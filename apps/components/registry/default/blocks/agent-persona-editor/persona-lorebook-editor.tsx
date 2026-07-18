'use client';

import type { LorebookEntry, PersonaLorebook } from '@wener/ai/agent/persona';
import { Plus, Trash2 } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import {
	AiConfigFieldGrid,
	AiConfigNumberField,
	AiConfigStringListField,
	AiConfigTextareaField,
	AiConfigTextField,
	AiConfigToggleField,
	JsonValueEditor,
	useStableListEntries,
} from '../../ui/ai-config-editor';

export type PersonaLorebookEditorProps = Omit<ComponentPropsWithRef<'div'>, 'onChange'> & {
	value?: PersonaLorebook;
	onChange: (value: PersonaLorebook) => void;
	disabled?: boolean;
	readOnly?: boolean;
	maxEntries?: number;
};

export function PersonaLorebookEditor({
	value,
	onChange,
	disabled = false,
	readOnly = false,
	maxEntries = 64,
	className,
	...props
}: PersonaLorebookEditorProps) {
	const lorebook: PersonaLorebook = value ?? { entries: [], bindings: [] };
	const boundedMax = Number.isInteger(maxEntries) ? Math.max(1, Math.min(maxEntries, 256)) : 64;
	const loreEntries = useStableListEntries(lorebook.entries, 'lore-entry');
	const updateEntry = (index: number, entry: LorebookEntry) =>
		onChange({
			...lorebook,
			entries: lorebook.entries.map((current, itemIndex) => (itemIndex === index ? entry : current)),
		});
	const removeEntry = (index: number) =>
		onChange({ ...lorebook, entries: lorebook.entries.filter((_, itemIndex) => itemIndex !== index) });
	return (
		<div className={`min-w-0 space-y-4 ${className ?? ''}`} {...props}>
			<AiConfigFieldGrid>
				<AiConfigTextField
					label='Lorebook 名称'
					value={lorebook.name}
					disabled={disabled}
					readOnly={readOnly}
					onValueChange={(name) => onChange({ ...lorebook, name: optional(name) })}
				/>
				<AiConfigNumberField
					label='扫描深度'
					value={lorebook.scanDepth}
					integer
					min={1}
					disabled={disabled}
					readOnly={readOnly}
					onValueChange={(scanDepth) => onChange({ ...lorebook, scanDepth })}
				/>
				<AiConfigNumberField
					label='Token 预算'
					value={lorebook.tokenBudget}
					integer
					min={1}
					disabled={disabled}
					readOnly={readOnly}
					onValueChange={(tokenBudget) => onChange({ ...lorebook, tokenBudget })}
				/>
				<AiConfigToggleField
					label='递归扫描'
					checked={lorebook.recursive ?? false}
					disabled={disabled || readOnly}
					onCheckedChange={(recursive) => onChange({ ...lorebook, recursive })}
				/>
			</AiConfigFieldGrid>
			<AiConfigTextareaField
				label='Lorebook 描述'
				value={lorebook.description}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(description) => onChange({ ...lorebook, description: optional(description) })}
			/>
			<div className='flex min-w-0 items-center justify-between gap-2'>
				<div>
					<h4 className='text-sm font-semibold'>Lore 条目</h4>
					<p className='text-base-content/60 text-xs'>
						{lorebook.entries.length} / {boundedMax}
					</p>
				</div>
				{!readOnly ? (
					<button
						type='button'
						className='btn btn-outline btn-sm'
						disabled={disabled || lorebook.entries.length >= boundedMax}
						onClick={() =>
							onChange({ ...lorebook, entries: [...lorebook.entries, createLorebookEntry(lorebook.entries)] })
						}
					>
						<Plus aria-hidden='true' className='size-4' />
						添加条目
					</button>
				) : null}
			</div>
			<div className='divide-base-300 border-base-300 divide-y border-y'>
				{lorebook.entries.length ? (
					loreEntries.map(({ item: entry, key }, index) => (
						<details key={key} className='group py-3' open={index === 0}>
							<summary className='flex cursor-pointer list-none items-center gap-2 text-sm font-medium'>
								<span className='min-w-0 flex-1 truncate'>{entry.name || entry.id}</span>
								<span className='badge badge-outline badge-sm'>{entry.enabled === false ? '停用' : '启用'}</span>
							</summary>
							<div className='mt-3 space-y-4 ps-2'>
								<AiConfigFieldGrid>
									<AiConfigTextField
										required
										label='条目 ID'
										value={entry.id}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(id) => updateEntry(index, { ...entry, id })}
									/>
									<AiConfigTextField
										label='条目名称'
										value={entry.name}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(name) => updateEntry(index, { ...entry, name: optional(name) })}
									/>
									<AiConfigNumberField
										label='优先级'
										value={entry.priority}
										integer
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(priority) => updateEntry(index, { ...entry, priority })}
									/>
									<AiConfigNumberField
										label='插入顺序'
										value={entry.insertionOrder}
										integer
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(insertionOrder) => updateEntry(index, { ...entry, insertionOrder })}
									/>
								</AiConfigFieldGrid>
								<AiConfigStringListField
									label='触发关键词'
									value={entry.keys}
									disabled={disabled}
									readOnly={readOnly}
									onChange={(keys) => updateEntry(index, { ...entry, keys })}
								/>
								<AiConfigStringListField
									label='次级关键词'
									value={entry.secondaryKeys}
									disabled={disabled}
									readOnly={readOnly}
									onChange={(secondaryKeys) => updateEntry(index, { ...entry, secondaryKeys })}
								/>
								<AiConfigTextareaField
									required
									label='内容'
									rows={6}
									value={entry.content}
									disabled={disabled}
									readOnly={readOnly}
									onValueChange={(content) => updateEntry(index, { ...entry, content })}
								/>
								<AiConfigFieldGrid className='lg:grid-cols-3'>
									<AiConfigToggleField
										label='启用'
										checked={entry.enabled ?? true}
										disabled={disabled || readOnly}
										onCheckedChange={(enabled) => updateEntry(index, { ...entry, enabled })}
									/>
									<AiConfigToggleField
										label='常量条目'
										checked={entry.constant ?? false}
										disabled={disabled || readOnly}
										onCheckedChange={(constant) => updateEntry(index, { ...entry, constant })}
									/>
									<AiConfigToggleField
										label='区分大小写'
										checked={entry.caseSensitive ?? false}
										disabled={disabled || readOnly}
										onCheckedChange={(caseSensitive) => updateEntry(index, { ...entry, caseSensitive })}
									/>
									<AiConfigToggleField
										label='正则表达式'
										checked={entry.useRegex ?? false}
										disabled={disabled || readOnly}
										onCheckedChange={(useRegex) => updateEntry(index, { ...entry, useRegex })}
									/>
								</AiConfigFieldGrid>
								{!readOnly ? (
									<div className='flex justify-end'>
										<button
											type='button'
											className='btn btn-ghost btn-sm text-error'
											disabled={disabled}
											onClick={() => removeEntry(index)}
										>
											<Trash2 aria-hidden='true' className='size-4' />
											删除条目
										</button>
									</div>
								) : null}
							</div>
						</details>
					))
				) : (
					<div className='text-base-content/55 py-6 text-center text-sm'>暂无 Lore 条目</div>
				)}
			</div>
			<JsonValueEditor
				label='外部 Lorebook 绑定'
				value={lorebook.bindings}
				disabled={disabled}
				readOnly={readOnly}
				onChange={(bindings) => onChange({ ...lorebook, bindings: bindings as PersonaLorebook['bindings'] })}
			/>
			<JsonValueEditor
				label='Lorebook Extensions'
				value={lorebook.extensions ?? {}}
				disabled={disabled}
				readOnly={readOnly}
				onChange={(extensions) => onChange({ ...lorebook, extensions: extensions as PersonaLorebook['extensions'] })}
			/>
		</div>
	);
}

export function createLorebookEntry(entries: readonly LorebookEntry[]): LorebookEntry {
	let suffix = entries.length + 1;
	while (entries.some((entry) => entry.id === `lore-${suffix}`)) suffix++;
	return { id: `lore-${suffix}`, keys: [], content: '', enabled: true };
}

function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
