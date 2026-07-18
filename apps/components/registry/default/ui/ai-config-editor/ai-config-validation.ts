import type { AiConfigEditorIssue, AiConfigSafeParseResult, AiConfigSchema } from './ai-config-types';

export function safeParseAiConfig<T>(schema: AiConfigSchema<T>, value: unknown): AiConfigSafeParseResult<T> {
	try {
		return schema.safeParse(value);
	} catch (error) {
		return { success: false, error };
	}
}

export function aiConfigIssues(error: unknown): AiConfigEditorIssue[] {
	const issueValues = readIssueArray(error);
	if (!issueValues) return [{ path: '', message: errorMessage(error) }];
	const issues = issueValues.map(toEditorIssue).filter((issue): issue is AiConfigEditorIssue => Boolean(issue));
	return issues.length ? issues : [{ path: '', message: errorMessage(error) }];
}

export function aiConfigFieldError(issues: readonly AiConfigEditorIssue[], path: string): string | undefined {
	return issues.find((issue) => issue.path === path || issue.path.startsWith(`${path}.`))?.message;
}

export function stringifyAiConfig(value: unknown, indentation = 2): string {
	try {
		return JSON.stringify(value, null, indentation) ?? 'null';
	} catch {
		return '';
	}
}

export function compactAiConfig(value: unknown): string {
	return stringifyAiConfig(value, 0);
}

function readIssueArray(error: unknown): unknown[] | undefined {
	if (!isRecord(error) || !Array.isArray(error.issues)) return undefined;
	return error.issues;
}

function toEditorIssue(value: unknown): AiConfigEditorIssue | undefined {
	if (!isRecord(value)) return undefined;
	const path = Array.isArray(value.path) ? value.path.map(String).join('.') : '';
	const message = typeof value.message === 'string' ? value.message : '配置值无效';
	return { path, message };
}

function errorMessage(error: unknown): string {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === 'string' && error) return error;
	return '配置值无效';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
