'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
	AiConfigDraftController,
	AiConfigEditorIssue,
	AiConfigSchema,
	AiConfigValidationMode,
} from './ai-config-types';
import { aiConfigIssues, compactAiConfig, safeParseAiConfig, stringifyAiConfig } from './ai-config-validation';

export type UseAiConfigDraftOptions<T> = {
	value: T;
	fallbackValue: T;
	schema: AiConfigSchema<T>;
	onChange: (value: T) => void;
	onSubmit?: (value: T) => void;
	validationMode?: AiConfigValidationMode;
};

type InitialDraft<T> = {
	draft: T;
	externalInvalid: boolean;
	externalError?: string;
	issues: AiConfigEditorIssue[];
};

export function useAiConfigDraft<T>({
	value,
	fallbackValue,
	schema,
	onChange,
	onSubmit,
	validationMode = 'change',
}: UseAiConfigDraftOptions<T>): AiConfigDraftController<T> {
	const initial = useMemo(() => initialDraft(schema, value, fallbackValue), [fallbackValue, schema, value]);
	const [draft, setDraftState] = useState(initial.draft);
	const [externalInvalid, setExternalInvalid] = useState(initial.externalInvalid);
	const [externalError, setExternalError] = useState(initial.externalError);
	const [issues, setIssues] = useState<AiConfigEditorIssue[]>(initial.issues);
	const [submitted, setSubmitted] = useState(false);
	const [jsonText, setJsonTextState] = useState(() => stringifyAiConfig(initial.draft));
	const [jsonError, setJsonError] = useState<string>();
	const externalDraft = initial.draft;

	useEffect(() => {
		setDraftState(initial.draft);
		setExternalInvalid(initial.externalInvalid);
		setExternalError(initial.externalError);
		setIssues(initial.issues);
		setJsonTextState(stringifyAiConfig(initial.draft));
		setJsonError(undefined);
		setSubmitted(false);
	}, [initial]);

	const setDraft = useCallback(
		(next: T) => {
			setDraftState(next);
			setJsonTextState(stringifyAiConfig(next));
			setJsonError(undefined);
			const parsed = safeParseAiConfig(schema, next);
			if (!parsed.success) {
				setIssues(aiConfigIssues(parsed.error));
				return;
			}
			setIssues([]);
			onChange(parsed.data);
		},
		[onChange, schema],
	);

	const setJsonText = useCallback((next: string) => {
		setJsonTextState(next);
		setJsonError(undefined);
	}, []);

	const applyJson = useCallback(() => {
		let candidate: unknown;
		try {
			candidate = JSON.parse(jsonText);
		} catch (error) {
			setJsonError(error instanceof Error ? error.message : 'JSON parse failed');
			return false;
		}
		const parsed = safeParseAiConfig(schema, candidate);
		if (!parsed.success) {
			const nextIssues = aiConfigIssues(parsed.error);
			setIssues(nextIssues);
			setJsonError(nextIssues[0]?.message ?? 'Invalid configuration');
			return false;
		}
		setDraftState(parsed.data);
		setIssues([]);
		setJsonError(undefined);
		setJsonTextState(stringifyAiConfig(parsed.data));
		onChange(parsed.data);
		return true;
	}, [jsonText, onChange, schema]);

	const reset = useCallback(() => {
		setDraftState(externalDraft);
		setIssues(initial.issues);
		setJsonTextState(stringifyAiConfig(externalDraft));
		setJsonError(undefined);
		setSubmitted(false);
	}, [externalDraft, initial.issues]);

	const submit = useCallback(() => {
		setSubmitted(true);
		const parsed = safeParseAiConfig(schema, draft);
		if (!parsed.success) {
			setIssues(aiConfigIssues(parsed.error));
			return false;
		}
		setIssues([]);
		onSubmit?.(parsed.data);
		return true;
	}, [draft, onSubmit, schema]);

	const dirty = compactAiConfig(draft) !== compactAiConfig(externalDraft);
	const visibleIssues = validationMode === 'change' || submitted ? issues : [];
	return {
		draft,
		dirty,
		externalInvalid,
		externalError,
		issues,
		visibleIssues,
		jsonText,
		jsonError,
		canSubmit: issues.length === 0,
		setDraft,
		setJsonText,
		applyJson,
		reset,
		submit,
	};
}

function initialDraft<T>(schema: AiConfigSchema<T>, value: T, fallbackValue: T): InitialDraft<T> {
	const parsed = safeParseAiConfig(schema, value);
	if (parsed.success) return { draft: parsed.data, externalInvalid: false, issues: [] };
	const fallback = safeParseAiConfig(schema, fallbackValue);
	const issues = aiConfigIssues(parsed.error);
	return {
		draft: fallback.success ? fallback.data : fallbackValue,
		externalInvalid: true,
		externalError: issues[0]?.message,
		issues,
	};
}
