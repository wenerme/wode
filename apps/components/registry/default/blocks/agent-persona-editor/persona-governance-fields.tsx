import type { Persona } from '@wener/ai/agent/persona';
import {
	AiConfigFieldGrid,
	AiConfigSelectField,
	AiConfigTextField,
	AiConfigToggleField,
} from '../../ui/ai-config-editor';

const visibility = ['private', 'unlisted', 'public'].map((value) => ({ value, label: value }));
const ratings = ['unknown', 'general', 'teen', 'mature', 'restricted'].map((value) => ({ value, label: value }));
const reviewStatuses = ['draft', 'pending', 'approved', 'rejected', 'withdrawn'].map((value) => ({
	value,
	label: value,
}));

export type PersonaGovernanceFieldsProps = {
	value: Persona;
	onChange: (value: Persona) => void;
	disabled?: boolean;
	readOnly?: boolean;
};

export function PersonaGovernanceFields({
	value,
	onChange,
	disabled = false,
	readOnly = false,
}: PersonaGovernanceFieldsProps) {
	const locked = disabled || readOnly;
	const patchGovernance = (next: Partial<NonNullable<Persona['governance']>>) =>
		onChange({ ...value, governance: { ...value.governance, ...next } });
	const patchRights = (next: Partial<NonNullable<Persona['rights']>>) =>
		onChange({ ...value, rights: { ...value.rights, ...next } });
	return (
		<AiConfigFieldGrid>
			<AiConfigSelectField
				label='可见性'
				value={value.governance?.visibility}
				options={visibility}
				disabled={locked}
				onValueChange={(next) =>
					patchGovernance({ visibility: next ? (next as NonNullable<Persona['governance']>['visibility']) : undefined })
				}
			/>
			<AiConfigSelectField
				label='内容分级'
				value={value.governance?.contentRating}
				options={ratings}
				disabled={locked}
				onValueChange={(next) =>
					patchGovernance({
						contentRating: next ? (next as NonNullable<Persona['governance']>['contentRating']) : undefined,
					})
				}
			/>
			<AiConfigSelectField
				label='审核状态'
				value={value.governance?.reviewStatus}
				options={reviewStatuses}
				disabled={locked}
				onValueChange={(next) =>
					patchGovernance({
						reviewStatus: next ? (next as NonNullable<Persona['governance']>['reviewStatus']) : undefined,
					})
				}
			/>
			<AiConfigTextField
				label='来源说明'
				value={value.governance?.provenance}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(provenance) => patchGovernance({ provenance: optional(provenance) })}
			/>
			<AiConfigTextField
				type='url'
				label='来源 URL'
				value={value.governance?.sourceUrl}
				placeholder='https://example.com/source'
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(sourceUrl) => patchGovernance({ sourceUrl: optional(sourceUrl) })}
			/>
			<AiConfigTextField
				label='License'
				value={value.rights?.license}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(license) => patchRights({ license: optional(license) })}
			/>
			<AiConfigTextField
				label='Rights Holder'
				value={value.rights?.rightsHolder}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(rightsHolder) => patchRights({ rightsHolder: optional(rightsHolder) })}
			/>
			<AiConfigTextField
				label='Source'
				value={value.rights?.source}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(source) => patchRights({ source: optional(source) })}
			/>
			<AiConfigToggleField
				label='允许再分发'
				checked={value.rights?.redistributable ?? false}
				disabled={locked}
				onCheckedChange={(redistributable) => patchRights({ redistributable })}
			/>
			<AiConfigToggleField
				label='允许商业使用'
				checked={value.rights?.commercialUse ?? false}
				disabled={locked}
				onCheckedChange={(commercialUse) => patchRights({ commercialUse })}
			/>
		</AiConfigFieldGrid>
	);
}

function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
