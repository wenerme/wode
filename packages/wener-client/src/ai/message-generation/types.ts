import type {
	GenerateMessage,
	GenerateMessageDiagnostic,
	GenerateMessageResponse,
	GenerateMessageResponseFormat,
	GenerateMessageUsage,
} from '../../api/generate-message';

export type {
	GenerateMessage,
	GenerateMessageDiagnostic,
	GenerateMessageResponse,
	GenerateMessageResponseFormat,
	GenerateMessageUsage,
} from '../../api/generate-message';

export type MessageGenerationProtocol = 'openai' | 'openai-response' | 'anthropic' | 'gemini';

export interface MessageGenerationTarget {
	api: MessageGenerationProtocol;
	baseUrl: string;
	apiKey?: string;
	headers?: Record<string, string>;
}

export interface MessageGenerationRequest {
	target: MessageGenerationTarget;
	model: string;
	messages: GenerateMessage[];
	system?: string;
	temperature?: number;
	topP?: number;
	maxOutputTokens?: number;
	responseFormat?: GenerateMessageResponseFormat;
	stream?: boolean;
}

export interface MessageGenerationResult {
	text: string;
	model?: string;
	response: GenerateMessageResponse;
	usage?: GenerateMessageUsage;
	diagnostics: GenerateMessageDiagnostic[];
}

export interface MessageGenerationOptions {
	fetch?: typeof globalThis.fetch;
	signal?: AbortSignal;
	onText?(text: string): void;
}

export interface PreparedMessageGenerationRequest {
	url: string;
	method: 'POST';
	headers: Record<string, string>;
	body: unknown;
}
