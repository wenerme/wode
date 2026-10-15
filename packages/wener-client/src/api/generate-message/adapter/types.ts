import type { ApiType } from '../../schema/ApiType';

/**
 * Native fields that the common model does not map, keyed by the protocol they came from.
 * A codec spreads its own protocol record back to the wire and reports other protocols as dropped,
 * unless a processor moves them to a target slot first.
 */
export type GenerateMessageExtensions = Partial<Record<ApiType, Record<string, unknown>>>;

/**
 * Encoding hints for exact same-protocol re-encoding, such as "content was a plain string".
 * Hints are never written to the wire as fields and other protocols ignore them.
 */
export type GenerateMessageHints = Partial<Record<ApiType, Record<string, unknown>>>;

export interface GenerateMessageNode {
	extensions?: GenerateMessageExtensions;
	hints?: GenerateMessageHints;
}

/** Opaque provider value, such as a thinking signature or encrypted reasoning, valid only for its protocol. */
export interface GenerateMessageOpaque {
	api: ApiType;
	value: string;
}

export type GenerateMessageRole = 'system' | 'developer' | 'user' | 'assistant' | 'tool' | (string & {});

export interface GenerateMessageTextPart extends GenerateMessageNode {
	type: 'text';
	text: string;
	/** Provider signature attached to this part, such as a Gemini `thoughtSignature`. */
	signature?: GenerateMessageOpaque;
}

export interface GenerateMessageImagePart extends GenerateMessageNode {
	type: 'image';
	/** Remote URL or data URL. */
	url?: string;
	/** Base64 payload without a data URL prefix. */
	data?: string;
	mediaType?: string;
	fileId?: string;
	detail?: string;
}

export interface GenerateMessageAudioPart extends GenerateMessageNode {
	type: 'audio';
	data?: string;
	url?: string;
	/** Audio format such as `wav` or `mp3`, or a media type. */
	format?: string;
}

export interface GenerateMessageFilePart extends GenerateMessageNode {
	type: 'file';
	data?: string;
	url?: string;
	fileId?: string;
	filename?: string;
	mediaType?: string;
}

export interface GenerateMessageRefusalPart extends GenerateMessageNode {
	type: 'refusal';
	text: string;
}

export interface GenerateMessageReasoningPart extends GenerateMessageNode {
	type: 'reasoning';
	/** Visible reasoning text. */
	text?: string;
	/** Reasoning summaries, when the provider separates them from full reasoning. */
	summary?: string[];
	/** Provider signature or encrypted reasoning needed to replay this reasoning. */
	signature?: GenerateMessageOpaque;
	/** Reasoning is hidden; `signature` carries the redacted payload. */
	redacted?: boolean;
}

export interface GenerateMessageToolCallPart extends GenerateMessageNode {
	type: 'tool-call';
	id: string;
	name: string;
	/** Raw arguments text: JSON for function tools, free text for custom tools. */
	arguments: string;
	toolType?: 'function' | 'custom' | (string & {});
	/** Provider signature attached to the call, such as a Gemini `thoughtSignature`. */
	signature?: GenerateMessageOpaque;
}

export interface GenerateMessageToolResultPart extends GenerateMessageNode {
	type: 'tool-result';
	toolCallId: string;
	name?: string;
	content: string | GenerateMessagePart[];
	isError?: boolean;
}

/** Native content block without a common mapping; re-emitted verbatim only for the same protocol. */
export interface GenerateMessageNativePart extends GenerateMessageNode {
	type: 'native';
	api: ApiType;
	value: unknown;
}

export type GenerateMessagePart =
	| GenerateMessageTextPart
	| GenerateMessageImagePart
	| GenerateMessageAudioPart
	| GenerateMessageFilePart
	| GenerateMessageRefusalPart
	| GenerateMessageReasoningPart
	| GenerateMessageToolCallPart
	| GenerateMessageToolResultPart
	| GenerateMessageNativePart;

export interface GenerateMessage extends GenerateMessageNode {
	role: GenerateMessageRole;
	content: GenerateMessagePart[];
	name?: string;
}

export interface GenerateMessageFunctionTool extends GenerateMessageNode {
	type: 'function' | 'custom';
	name: string;
	description?: string;
	/** JSON Schema for function tools, grammar or format object for custom tools. */
	parameters?: unknown;
	strict?: boolean;
}

export interface GenerateMessageNativeTool extends GenerateMessageNode {
	type: 'native';
	api: ApiType;
	value: unknown;
}

export type GenerateMessageTool = GenerateMessageFunctionTool | GenerateMessageNativeTool;

export type GenerateMessageToolChoice =
	| 'auto'
	| 'none'
	| 'required'
	| { type: 'tool'; name: string }
	| { type: 'native'; api: ApiType; value: unknown };

export interface GenerateMessageResponseFormat extends GenerateMessageNode {
	type: 'text' | 'json_object' | 'json_schema';
	name?: string;
	description?: string;
	schema?: unknown;
	strict?: boolean;
}

export interface GenerateMessageReasoningConfig extends GenerateMessageNode {
	/** Effort level such as `low`, `medium`, `high`. */
	effort?: string;
	summary?: string;
	budgetTokens?: number;
	/** Explicitly enabled or disabled; omitted when the request does not say. */
	enabled?: boolean;
}

export interface GenerateMessageRequest extends GenerateMessageNode {
	model?: string;
	/** Top-level instructions: Responses `instructions`, Anthropic `system`, Gemini `systemInstruction`. */
	system?: GenerateMessagePart[];
	messages: GenerateMessage[];
	tools?: GenerateMessageTool[];
	toolChoice?: GenerateMessageToolChoice;
	parallelToolCalls?: boolean;
	stream?: boolean;
	maxOutputTokens?: number;
	temperature?: number;
	topP?: number;
	topK?: number;
	stop?: string[];
	seed?: number;
	presencePenalty?: number;
	frequencyPenalty?: number;
	/** Number of choices or candidates. */
	n?: number;
	reasoning?: GenerateMessageReasoningConfig;
	responseFormat?: GenerateMessageResponseFormat;
	user?: string;
	metadata?: Record<string, string>;
}

export type GenerateMessageFinishReason = 'stop' | 'length' | 'tool-calls' | 'content-filter' | 'error' | 'other';

/** Token usage. `inputTokens` includes cached input; `outputTokens` includes reasoning. */
export interface GenerateMessageUsage extends GenerateMessageNode {
	inputTokens?: number;
	outputTokens?: number;
	totalTokens?: number;
	cachedInputTokens?: number;
	cacheWriteInputTokens?: number;
	reasoningTokens?: number;
}

export interface GenerateMessageChoice extends GenerateMessageNode {
	index: number;
	message: GenerateMessage;
	finishReason?: GenerateMessageFinishReason;
}

export interface GenerateMessageResponse extends GenerateMessageNode {
	id?: string;
	model?: string;
	/** Creation time in Unix seconds. */
	created?: number;
	choices: GenerateMessageChoice[];
	usage?: GenerateMessageUsage;
}

export type GenerateMessageErrorKind =
	| 'invalid-request'
	| 'authentication'
	| 'permission'
	| 'not-found'
	| 'rate-limit'
	| 'overloaded'
	| 'server'
	| 'timeout'
	| 'context-length'
	| 'content-filter'
	| 'other';

export interface GenerateMessageError extends GenerateMessageNode {
	kind: GenerateMessageErrorKind;
	message: string;
	status?: number;
	code?: string;
	param?: string;
}

/**
 * Stream events. `choice` is the choice/candidate index; `index` is the part index within that choice's message.
 * A `part-start` part may be partial; deltas append to it and `part-end` may carry the final part.
 */
export type GenerateMessageStreamEvent =
	| ({ type: 'start'; id?: string; model?: string; created?: number } & GenerateMessageNode)
	| ({
			type: 'part-start';
			choice: number;
			index: number;
			role?: GenerateMessageRole;
			part: GenerateMessagePart;
	  } & GenerateMessageNode)
	| {
			type: 'part-delta';
			choice: number;
			index: number;
			delta: { text?: string; arguments?: string; signature?: string; summary?: string };
	  }
	| ({ type: 'part-end'; choice: number; index: number; part?: GenerateMessagePart } & GenerateMessageNode)
	| ({ type: 'finish'; choice: number; finishReason?: GenerateMessageFinishReason } & GenerateMessageNode)
	| { type: 'usage'; usage: GenerateMessageUsage }
	| ({ type: 'error'; error: GenerateMessageError } & GenerateMessageNode)
	| { type: 'native'; api: ApiType; value: unknown };

export type GenerateMessageDiagnosticCode = 'drop' | 'lossy' | 'reorder' | 'default' | 'invalid';

export interface GenerateMessageDiagnostic {
	code: GenerateMessageDiagnosticCode;
	/** Location in the source or common model, such as `messages[2].content[0].signature`. */
	path: string;
	message: string;
	api?: ApiType;
}
