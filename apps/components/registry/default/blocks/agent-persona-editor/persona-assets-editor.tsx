'use client';

import type { PersonaAsset } from '@wener/ai/agent/persona';
import { Plus, Trash2 } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import {
	AiConfigFieldGrid,
	AiConfigNumberField,
	AiConfigSelectField,
	AiConfigStringListField,
	AiConfigTextareaField,
	AiConfigTextField,
	AiConfigToggleField,
	useStableListEntries,
} from '../../ui/ai-config-editor';

const assetTypes = ['avatar', 'icon', 'background', 'emotion', 'voice', 'model', 'document', 'other'].map((value) => ({
	value,
	label: value,
}));
export type PersonaAssetsEditorProps = Omit<ComponentPropsWithRef<'div'>, 'onChange'> & {
	value: readonly PersonaAsset[];
	onChange: (value: PersonaAsset[]) => void;
	disabled?: boolean;
	readOnly?: boolean;
	maxAssets?: number;
};

export function PersonaAssetsEditor({
	value,
	onChange,
	disabled = false,
	readOnly = false,
	maxAssets = 64,
	className,
	...props
}: PersonaAssetsEditorProps) {
	const boundedMax = Number.isInteger(maxAssets) ? Math.max(1, Math.min(maxAssets, 256)) : 64;
	const assetEntries = useStableListEntries(value, 'persona-asset');
	const update = (index: number, asset: PersonaAsset) =>
		onChange(value.map((current, itemIndex) => (itemIndex === index ? asset : current)));
	return (
		<div className={`min-w-0 space-y-3 ${className ?? ''}`} {...props}>
			<div className='flex items-center justify-between gap-2'>
				<p className='text-base-content/60 text-xs'>
					{value.length} / {boundedMax} 个 manifest；仅保存 URI 和元数据。
				</p>
				{!readOnly ? (
					<button
						type='button'
						className='btn btn-outline btn-sm'
						disabled={disabled || value.length >= boundedMax}
						onClick={() => onChange([...value, createPersonaAsset(value)])}
					>
						<Plus aria-hidden='true' className='size-4' />
						添加资源
					</button>
				) : null}
			</div>
			<div className='divide-base-300 border-base-300 divide-y border-y'>
				{value.length ? (
					assetEntries.map(({ item: asset, key }, index) => (
						<details key={key} className='py-3' open={index === 0}>
							<summary className='flex cursor-pointer list-none items-center gap-2 text-sm font-medium'>
								<span className='min-w-0 flex-1 truncate'>{asset.name || asset.id}</span>
								<span className='badge badge-outline badge-sm'>{asset.type}</span>
							</summary>
							<div className='mt-3 space-y-4 ps-2'>
								<AiConfigFieldGrid>
									<AiConfigTextField
										required
										label='资源 ID'
										value={asset.id}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(id) => update(index, { ...asset, id })}
									/>
									<AiConfigSelectField
										required
										label='资源类型'
										value={asset.type}
										options={assetTypes}
										disabled={disabled || readOnly}
										onValueChange={(type) => update(index, { ...asset, type: type as PersonaAsset['type'] })}
									/>
									<AiConfigTextField
										required
										type='url'
										label='资源 URI'
										value={asset.uri}
										placeholder='https://cdn.example.com/persona/avatar.png'
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(uri) => update(index, { ...asset, uri })}
									/>
									<AiConfigTextField
										label='名称'
										value={asset.name}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(name) => update(index, { ...asset, name: optional(name) })}
									/>
									<AiConfigTextField
										label='Media Type'
										value={asset.mediaType}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(mediaType) => update(index, { ...asset, mediaType: optional(mediaType) })}
									/>
									<AiConfigTextField
										label='Checksum'
										value={asset.checksum}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(checksum) => update(index, { ...asset, checksum: optional(checksum) })}
									/>
									<AiConfigNumberField
										label='大小（bytes）'
										value={asset.size}
										integer
										min={0}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(size) => update(index, { ...asset, size })}
									/>
								</AiConfigFieldGrid>
								<AiConfigTextareaField
									label='描述'
									value={asset.description}
									disabled={disabled}
									readOnly={readOnly}
									onValueChange={(description) => update(index, { ...asset, description: optional(description) })}
								/>
								<AiConfigStringListField
									label='资源标签'
									value={asset.tags}
									disabled={disabled}
									readOnly={readOnly}
									onChange={(tags) => update(index, { ...asset, tags })}
								/>
								<AiConfigFieldGrid>
									<AiConfigTextField
										label='License'
										value={asset.rights?.license}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(license) =>
											update(index, { ...asset, rights: { ...asset.rights, license: optional(license) } })
										}
									/>
									<AiConfigTextField
										label='Rights Holder'
										value={asset.rights?.rightsHolder}
										disabled={disabled}
										readOnly={readOnly}
										onValueChange={(rightsHolder) =>
											update(index, { ...asset, rights: { ...asset.rights, rightsHolder: optional(rightsHolder) } })
										}
									/>
									<AiConfigToggleField
										label='允许再分发'
										checked={asset.rights?.redistributable ?? false}
										disabled={disabled || readOnly}
										onCheckedChange={(redistributable) =>
											update(index, { ...asset, rights: { ...asset.rights, redistributable } })
										}
									/>
								</AiConfigFieldGrid>
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

export function createPersonaAsset(assets: readonly PersonaAsset[]): PersonaAsset {
	let suffix = assets.length + 1;
	while (assets.some((asset) => asset.id === `asset-${suffix}`)) suffix++;
	return { id: `asset-${suffix}`, type: 'other', uri: 'https://cdn.example.com/persona/asset' };
}

function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
