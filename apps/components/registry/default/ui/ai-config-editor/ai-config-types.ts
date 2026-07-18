import type { ComponentType, ReactNode } from 'react';

export type AiConfigEditorMode = 'form' | 'json';
export type AiConfigValidationMode = 'change' | 'submit';

export type AiConfigSafeParseResult<T> = { success: true; data: T } | { success: false; error: unknown };

export type AiConfigSchema<T> = {
	safeParse: (value: unknown) => AiConfigSafeParseResult<T>;
};

export type AiConfigEditorIssue = {
	path: string;
	message: string;
};

export type AiConfigFieldSlotProps<T> = {
	name: string;
	draft: T;
	disabled: boolean;
	readOnly: boolean;
	error?: string;
	defaultField: ReactNode;
	onDraftChange: (value: T) => void;
};

export type AiConfigEditorSlots<T> = {
	beforeForm?: ReactNode;
	afterForm?: ReactNode;
	headerActions?: ReactNode;
	fieldSlots?: Readonly<Record<string, ComponentType<AiConfigFieldSlotProps<T>>>>;
	summary?: ComponentType<AiConfigSummarySlotProps>;
};

export type AiConfigSummarySlotProps = {
	issues: readonly AiConfigEditorIssue[];
	defaultSummary: ReactNode;
};

export type AiConfigDraftController<T> = {
	draft: T;
	dirty: boolean;
	externalInvalid: boolean;
	externalError?: string;
	issues: readonly AiConfigEditorIssue[];
	visibleIssues: readonly AiConfigEditorIssue[];
	jsonText: string;
	jsonError?: string;
	canSubmit: boolean;
	setDraft: (value: T) => void;
	setJsonText: (value: string) => void;
	applyJson: () => boolean;
	reset: () => void;
	submit: () => boolean;
};

export type AiConfigEditorMessages = {
	formMode: string;
	jsonMode: string;
	reset: string;
	submit: string;
	applyJson: string;
	invalidExternalTitle: string;
	invalidExternalDescription: string;
	invalidJson: string;
	validationTitle: string;
	validationCount: (count: number) => string;
	jsonLabel: string;
	readOnly: string;
};

export type AiConfigEditorMessageOverrides = Partial<AiConfigEditorMessages>;

export type AiConfigEditorOption = {
	value: string;
	label: string;
	description?: string;
	disabled?: boolean;
};

export type AiResourceEditorMessages<Field extends string, Section extends string> = {
	title: string;
	description: string;
	fields: Record<Field, string>;
	sections: Record<Section, string>;
	editor?: AiConfigEditorMessageOverrides;
};

export type AiResourceEditorMessageOverrides<Field extends string, Section extends string> = {
	title?: string;
	description?: string;
	fields?: Partial<Record<Field, string>>;
	sections?: Partial<Record<Section, string>>;
	editor?: AiConfigEditorMessageOverrides;
};

export function mergeResourceEditorMessages<Field extends string, Section extends string>(
	defaults: AiResourceEditorMessages<Field, Section>,
	overrides?: AiResourceEditorMessageOverrides<Field, Section>,
): AiResourceEditorMessages<Field, Section> {
	return {
		title: overrides?.title ?? defaults.title,
		description: overrides?.description ?? defaults.description,
		fields: { ...defaults.fields, ...overrides?.fields },
		sections: { ...defaults.sections, ...overrides?.sections },
		editor: { ...defaults.editor, ...overrides?.editor },
	};
}
