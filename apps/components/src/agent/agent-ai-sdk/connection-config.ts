import { z } from 'zod';

export type OpenAICompatibleConnectionConfig = {
	apiKey?: string;
	baseUrl: string;
	headers?: Record<string, string>;
	model: string;
};

export type OpenAICompatibleConnectionDraft = OpenAICompatibleConnectionConfig;

export type ConnectionValidationIssue = {
	field: 'apiKey' | 'baseUrl' | 'headers' | 'model';
	message: string;
};

export type ConnectionValidationResult =
	| { success: true; value: OpenAICompatibleConnectionConfig }
	| { issues: ConnectionValidationIssue[]; success: false };

const baseUrlSchema = z
	.string()
	.trim()
	.min(1, '请输入 Base URL。')
	.max(2048, 'Base URL 过长。')
	.refine(isAllowedBaseUrl, 'Base URL 必须是有效的 HTTP 或 HTTPS 地址，且不能包含凭据、查询参数或片段。')
	.transform(normalizeOpenAICompatibleBaseUrl);

const connectionSchema = z
	.object({
		apiKey: z
			.string()
			.max(16 * 1024, 'API Key 过长。')
			.optional(),
		baseUrl: baseUrlSchema,
		headers: z
			.record(z.string().min(1).max(128), z.string().max(8 * 1024))
			.refine((headers) => Object.keys(headers).length <= 64, '请求头不能超过 64 项。')
			.refine(
				(headers) => Object.entries(headers).every(([name, value]) => !/[\r\n]/u.test(name) && !/[\r\n]/u.test(value)),
				'请求头不能包含换行符。',
			)
			.optional(),
		model: z.string().trim().min(1, '请输入模型。').max(256, '模型名称过长。'),
	})
	.strict();

export function normalizeOpenAICompatibleBaseUrl(value: string): string {
	return value.replace(/\/+$/u, '');
}

export function validateOpenAICompatibleBaseUrl(
	value: string,
): { success: true; value: string } | { message: string; success: false } {
	const result = baseUrlSchema.safeParse(value);
	return result.success
		? { success: true, value: result.data }
		: { success: false, message: result.error.issues[0]?.message ?? 'Base URL 无效。' };
}

export function validateOpenAICompatibleConnection(input: unknown): ConnectionValidationResult {
	const result = connectionSchema.safeParse(input);
	if (result.success) return { success: true, value: result.data };
	return {
		success: false,
		issues: result.error.issues.slice(0, 8).map((issue) => ({
			field: toConnectionField(issue.path[0]),
			message: issue.message,
		})),
	};
}

export function requireOpenAICompatibleConnection(input: unknown): OpenAICompatibleConnectionConfig {
	const result = validateOpenAICompatibleConnection(input);
	if (result.success) return result.value;
	throw new Error(result.issues[0]?.message ?? '连接配置无效。');
}

export function sameOpenAICompatibleConnection(
	left: OpenAICompatibleConnectionConfig,
	right: OpenAICompatibleConnectionConfig,
): boolean {
	if (left.baseUrl !== right.baseUrl || left.apiKey !== right.apiKey || left.model !== right.model) return false;
	const leftHeaders = left.headers ?? {};
	const rightHeaders = right.headers ?? {};
	const leftKeys = Object.keys(leftHeaders);
	const rightKeys = Object.keys(rightHeaders);
	return leftKeys.length === rightKeys.length && leftKeys.every((key) => rightHeaders[key] === leftHeaders[key]);
}

function isAllowedBaseUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return (
			(url.protocol === 'http:' || url.protocol === 'https:') &&
			url.hostname.length > 0 &&
			url.username.length === 0 &&
			url.password.length === 0 &&
			url.search.length === 0 &&
			url.hash.length === 0
		);
	} catch {
		return false;
	}
}

function toConnectionField(value: PropertyKey | undefined): ConnectionValidationIssue['field'] {
	if (value === 'apiKey' || value === 'headers' || value === 'model') return value;
	return 'baseUrl';
}
