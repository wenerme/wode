import type {
	GenerateMessage,
	GenerateMessageDiagnostic,
	GenerateMessageResponse,
	GenerateMessageResponseFormat,
	GenerateMessageUsage,
} from '@wener/client/api/generate-message';

export type {
	GenerateMessage,
	GenerateMessageDiagnostic,
	GenerateMessageResponse,
	GenerateMessageResponseFormat,
	GenerateMessageUsage,
} from '@wener/client/api/generate-message';

export type PromptProtocol = 'openai' | 'openai-response' | 'anthropic' | 'gemini';

export interface PromptTarget {
	api: PromptProtocol;
	baseUrl: string;
	apiKey?: string;
	headers?: Record<string, string>;
}

export interface PromptRequest {
	target: PromptTarget;
	model: string;
	messages: GenerateMessage[];
	system?: string;
	temperature?: number;
	topP?: number;
	maxOutputTokens?: number;
	responseFormat?: GenerateMessageResponseFormat;
	stream?: boolean;
}

export interface PromptResult {
	text: string;
	model?: string;
	response: GenerateMessageResponse;
	usage?: GenerateMessageUsage;
	diagnostics: GenerateMessageDiagnostic[];
}

export interface PromptExecutionOptions {
	fetch?: typeof globalThis.fetch;
	signal?: AbortSignal;
	onText?(text: string): void;
}

export interface PreparedPromptRequest {
	url: string;
	method: 'POST';
	headers: Record<string, string>;
	body: unknown;
}
