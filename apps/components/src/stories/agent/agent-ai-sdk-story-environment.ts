import { validateOpenAICompatibleConnection } from '../../agent/agent-ai-sdk/connection-config.ts';
import type { OpenAICompatibleConnectionDraft } from '../../agent/agent-ai-sdk/index.ts';

declare const __WODE_STORYBOOK_OPENAI_CONNECTION__: unknown;

export function createLiveOpenAIConnectionStoryDefinition(input: unknown, development: boolean): string {
	if (!development) return 'undefined';
	const connection = readLiveOpenAIConnectionStoryEnvironment(input);
	return connection ? JSON.stringify(connection) : 'undefined';
}

export function readLiveOpenAIConnectionStoryEnvironment(
	input: unknown = readInjectedEnvironment(),
): OpenAICompatibleConnectionDraft | undefined {
	if (!isRecord(input)) return undefined;
	const apiKey = nonEmptyString(input.apiKey);
	const baseUrl = nonEmptyString(input.baseUrl);
	const model = nonEmptyString(input.model);
	if (!apiKey || !baseUrl || !model) return undefined;
	const result = validateOpenAICompatibleConnection({ apiKey, baseUrl, headers: {}, model });
	return result.success ? result.value : undefined;
}

function readInjectedEnvironment(): unknown {
	return typeof __WODE_STORYBOOK_OPENAI_CONNECTION__ === 'undefined' ? undefined : __WODE_STORYBOOK_OPENAI_CONNECTION__;
}

function nonEmptyString(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	const normalized = value.trim();
	return normalized ? normalized : undefined;
}

function isRecord(value: unknown): value is Readonly<Record<PropertyKey, unknown>> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
