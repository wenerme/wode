'use client';

import type { SkillResource } from '@wener/ai/agent/skill';
import { Plus, Trash2 } from 'lucide-react';
import {
	AiConfigFieldGrid,
	AiConfigSelectField,
	AiConfigTextareaField,
	AiConfigTextField,
	AiConfigToggleField,
	useStableListEntries,
} from '../../ui/ai-config-editor';

const resourceTypes = ['reference', 'template', 'example', 'script', 'asset', 'schema', 'other'].map((value) => ({
	value,
	label: value,
}));
export type SkillResourcesEditorProps = {
	value: readonly SkillResource[];
	onChange: (value: SkillResource[]) => void;
	disabled?: boolean;
	readOnly?: boolean;
	maxResources?: number;
};

export function SkillResourcesEditor({
	value,
	onChange,
	disabled = false,
	readOnly = false,
	maxResources = 64,
}: SkillResourcesEditorProps) {
	const maximum = Number.isInteger(maxResources) ? Math.max(1, Math.min(maxResources, 256)) : 64;
	const resourceEntries = useStableListEntries(value, 'skill-resource');
	const update = (index: number, resource: SkillResource) =>
		onChange(value.map((current, itemIndex) => (itemIndex === index ? resource : current)));
	return (
		<div className='min-w-0 space-y-3'>
			<div className='flex items-center justify-between gap-2'>
				<p className='text-base-content/60 text-xs'>
					{value.length} / {maximum} 个资源 manifest
				</p>
				{!readOnly ? (
					<button
						type='button'
						className='btn btn-outline btn-sm'
						disabled={disabled || value.length >= maximum}
						onClick={() => onChange([...value, createResource(value)])}
					>
						<Plus aria-hidden='true' className='size-4' />
						添加资源
					</button>
				) : null}
			</div>
			<div className='divide-base-300 border-base-300 divide-y border-y'>
				{value.length ? (
					resourceEntries.map(({ item: resource, key }, index) => (
						<details key={key} className='py-3' open={index === 0}>
							<summary className='flex cursor-pointer list-none gap-2 text-sm font-medium'>
								<span className='min-w-0 flex-1 truncate'>{resource.id}</span>
								<span className='badge badge-outline badge-sm'>{resource.type}</span>
							</summary>
							<div className='mt-3 space-y-3 ps-2'>
								<AiConfigFieldGrid>
									<AiConfigTextField
										required
										label='资源 ID'
										value={resource.id}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(id) => update(index, { ...resource, id })}
									/>
									<AiConfigSelectField
										required
										label='类型'
										value={resource.type}
										options={resourceTypes}
										disabled={disabled || readOnly}
										onValueChange={(type) => update(index, { ...resource, type: type as SkillResource['type'] })}
									/>
									<AiConfigTextField
										label='相对路径'
										value={resource.path}
										placeholder='references/example.md'
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(path) => update(index, { ...resource, path: optional(path) })}
									/>
									<AiConfigTextField
										type='url'
										label='URI'
										value={resource.uri}
										placeholder='https://example.com/resource'
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(uri) => update(index, { ...resource, uri: optional(uri) })}
									/>
									<AiConfigTextField
										label='Media Type'
										value={resource.mediaType}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(mediaType) => update(index, { ...resource, mediaType: optional(mediaType) })}
									/>
									<AiConfigTextField
										label='Checksum'
										value={resource.checksum}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(checksum) => update(index, { ...resource, checksum: optional(checksum) })}
									/>
								</AiConfigFieldGrid>
								<AiConfigTextareaField
									label='描述'
									value={resource.description}
									disabled={disabled}
									readOnly={readOnly}
									onValueChange={(description) => update(index, { ...resource, description: optional(description) })}
								/>
								<AiConfigToggleField
									label='必需'
									checked={resource.required ?? false}
									disabled={disabled || readOnly}
									onCheckedChange={(required) => update(index, { ...resource, required })}
								/>
								{!readOnly ? (
									<div className='flex justify-end'>
										<button
											type='button'
											className='btn btn-ghost btn-sm text-error'
											disabled={disabled}
											onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
										>
											<Trash2 aria-hidden='true' className='size-4' />
											删除资源
										</button>
									</div>
								) : null}
							</div>
						</details>
					))
				) : (
					<div className='text-base-content/55 py-6 text-center text-sm'>暂无资源 manifest</div>
				)}
			</div>
		</div>
	);
}

function createResource(items: readonly SkillResource[]): SkillResource {
	let suffix = items.length + 1;
	while (items.some((item) => item.id === `resource-${suffix}`)) suffix++;
	return { id: `resource-${suffix}`, type: 'reference', path: `references/resource-${suffix}.md` };
}
function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
