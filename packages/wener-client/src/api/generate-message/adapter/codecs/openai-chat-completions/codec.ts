import type { z } from 'zod';
import {
	OpenAIChatCompletionsChunkSchema,
	type OpenAIChatCompletionsRequest,
	OpenAIChatCompletionsRequestSchema,
	type OpenAIChatCompletionsResponse,
	OpenAIChatCompletionsResponseSchema,
	OpenAIChatCompletionsStreamEventSchema,
} from '../../../../openai-chat-completions/schema';
import { ApiType } from '../../../../schema/ApiType';
import type { GenerateMessageCodec, GenerateMessageWireError } from '../../codec';
import type { GenerateMessageAdapterContext } from '../../context';
import type {
	GenerateMessage,
	GenerateMessageChoice,
	GenerateMessageError,
	GenerateMessageErrorKind,
	GenerateMessageFinishReason,
	GenerateMessageFunctionTool,
	GenerateMessageNode,
	GenerateMessageOpaque,
	GenerateMessagePart,
	GenerateMessageRequest,
	GenerateMessageResponse,
	GenerateMessageResponseFormat,
	GenerateMessageRole,
	GenerateMessageStreamEvent,
	GenerateMessageTool,
	GenerateMessageToolCallPart,
	GenerateMessageUsage,
} from '../../types';
import {
	applyExtensions,
	errorKindFromStatus,
	getHint,
	isRecord,
	mergeExtensions,
	pickExtensions,
	statusFromErrorKind,
	withHint,
} from '../../utils';

const API = ApiType.OpenAIChatCompletions;
type Wire = Record<string, unknown>;
type ChatChunk = z.infer<typeof OpenAIChatCompletionsStreamEventSchema>;
type ChatRequest = z.infer<typeof OpenAIChatCompletionsRequestSchema>;
type ChatResponse = z.infer<typeof OpenAIChatCompletionsResponseSchema>;
type Ctx = GenerateMessageAdapterContext;

function hint<T = unknown>(node: GenerateMessageNode | undefined, key: string): T | undefined {
	return getHint<T>(node, API, key);
}
function setHint<T extends GenerateMessageNode>(node: T, key: string, value: unknown): T {
	return withHint(node, API, key, value);
}
function ext(wire: Wire, known: readonly string[]) {
	return pickExtensions(API, wire, known);
}
function drop(ctx: Ctx, path: string, message: string, api?: ApiType): void {
	ctx.report({ code: 'drop', path, message, api });
}
function applyExt<T extends Wire>(node: GenerateMessageNode | undefined, wire: T, ctx: Ctx, path: string): T {
	return applyExtensions(API, node, wire, ctx, path);
}
function sameProtocol(ctx: Ctx): boolean {
	return ctx.source === API && ctx.target === API;
}
function ownExt(node: GenerateMessageNode | undefined, key: string): unknown {
	return node?.extensions?.[API]?.[key];
}

function signatureApi(format: unknown): ApiType {
	if (format === 'anthropic-claude-v1') return ApiType.AnthropicMessages;
	if (format === 'google-gemini-v1') return ApiType.GoogleGenerativeAI;
	if (format === 'openai-responses-v1') return ApiType.OpenAIResponses;
	return API;
}
function signatureFormat(api: ApiType): string | undefined {
	if (api === ApiType.AnthropicMessages || api === ApiType.GoogleVertexAnthropicMessages) return 'anthropic-claude-v1';
	if (api === ApiType.GoogleGenerativeAI || api === ApiType.GoogleVertex) return 'google-gemini-v1';
	if (api === ApiType.OpenAIResponses) return 'openai-responses-v1';
	return undefined;
}
function isChatSignature(signature: GenerateMessageOpaque | undefined): boolean {
	return signature?.api === API;
}

function decodeContentPart(value: unknown): GenerateMessagePart {
	if (!isRecord(value)) return { type: 'native', api: API, value };
	switch (value.type) {
		case 'text': {
			if (typeof value.text !== 'string') break;
			const part: GenerateMessagePart = { type: 'text', text: value.text };
			mergeExtensions(part, ext(value, ['type', 'text']));
			return part;
		}
		case 'image_url': {
			const image = value.image_url;
			const part: GenerateMessagePart = { type: 'image' };
			if (typeof image === 'string') {
				part.url = image;
				setHint(part, 'imageUrlString', true);
			} else if (isRecord(image) && typeof image.url === 'string') {
				part.url = image.url;
				if (typeof image.detail === 'string') part.detail = image.detail;
				const rest = ext(image, ['url', 'detail'])?.[API];
				if (rest) setHint(part, 'imageUrlRest', rest);
			} else break;
			mergeExtensions(part, ext(value, ['type', 'image_url']));
			return part;
		}
		case 'input_audio': {
			const audio = value.input_audio;
			if (!isRecord(audio) || typeof audio.data !== 'string' || typeof audio.format !== 'string') break;
			const part: GenerateMessagePart = { type: 'audio', data: audio.data, format: audio.format };
			mergeExtensions(part, ext(value, ['type', 'input_audio']));
			const rest = ext(audio, ['data', 'format']);
			if (rest) setHint(part, 'inputAudioRest', rest[API]);
			return part;
		}
		case 'file': {
			const file = value.file;
			if (!isRecord(file)) break;
			const part: GenerateMessagePart = { type: 'file' };
			if (typeof file.file_data === 'string') part.data = file.file_data;
			if (typeof file.file_id === 'string') part.fileId = file.file_id;
			if (typeof file.filename === 'string') part.filename = file.filename;
			mergeExtensions(part, ext(value, ['type', 'file']));
			const rest = ext(file, ['file_data', 'file_id', 'filename']);
			if (rest) setHint(part, 'fileRest', rest[API]);
			return part;
		}
		case 'refusal': {
			if (typeof value.refusal !== 'string') break;
			const part: GenerateMessagePart = { type: 'refusal', text: value.refusal };
			mergeExtensions(part, ext(value, ['type', 'refusal']));
			return part;
		}
	}
	return { type: 'native', api: API, value };
}

function decodeContent(value: unknown): {
	parts: GenerateMessagePart[];
	shape: 'string' | 'array' | 'null' | 'missing';
} {
	if (typeof value === 'string') return { parts: [{ type: 'text', text: value }], shape: 'string' };
	if (Array.isArray(value)) return { parts: value.map(decodeContentPart), shape: 'array' };
	if (value === null) return { parts: [], shape: 'null' };
	return { parts: [], shape: 'missing' };
}

function decodeReasoningDetails(message: Wire): GenerateMessagePart[] {
	const details = message.reasoning_details;
	if (!Array.isArray(details)) return [];
	const parts: GenerateMessagePart[] = [];
	for (const detail of details) {
		if (!isRecord(detail)) {
			parts.push({ type: 'native', api: API, value: detail });
			continue;
		}
		const type = detail.type;
		if (type === 'reasoning.text') {
			const part: GenerateMessagePart = { type: 'reasoning' };
			if (typeof detail.text === 'string') part.text = detail.text;
			if (typeof detail.signature === 'string')
				part.signature = { api: signatureApi(detail.format), value: detail.signature };
			if (typeof detail.summary === 'string') part.summary = [detail.summary];
			mergeExtensions(part, ext(detail, ['type', 'text', 'signature', 'summary', 'format', 'index']));
			parts.push(part);
		} else if (type === 'reasoning.encrypted') {
			const data = typeof detail.data === 'string' ? detail.data : undefined;
			const part: GenerateMessagePart = { type: 'reasoning', redacted: true };
			if (data !== undefined) part.signature = { api: signatureApi(detail.format), value: data };
			mergeExtensions(part, ext(detail, ['type', 'data', 'format', 'index']));
			parts.push(part);
		} else if (type === 'reasoning.summary') {
			const part: GenerateMessagePart = { type: 'reasoning' };
			if (typeof detail.summary === 'string') part.summary = [detail.summary];
			if (typeof detail.text === 'string') part.text = detail.text;
			mergeExtensions(part, ext(detail, ['type', 'summary', 'text', 'format', 'index']));
			parts.push(part);
		} else {
			parts.push({ type: 'native', api: API, value: detail });
		}
	}
	return parts;
}

function decodeToolCall(value: unknown): GenerateMessagePart {
	if (!isRecord(value) || typeof value.id !== 'string' || typeof value.type !== 'string') {
		return { type: 'native', api: API, value };
	}
	if (value.type === 'function' && isRecord(value.function) && typeof value.function.name === 'string') {
		const call: GenerateMessageToolCallPart = {
			type: 'tool-call',
			id: value.id,
			name: value.function.name,
			arguments: typeof value.function.arguments === 'string' ? value.function.arguments : '',
			toolType: 'function',
		};
		const extra = value.extra_content;
		if (isRecord(extra) && isRecord(extra.google) && typeof extra.google.thought_signature === 'string') {
			call.signature = { api: ApiType.GoogleGenerativeAI, value: extra.google.thought_signature };
		}
		mergeExtensions(call, ext(value, ['id', 'type', 'function', 'extra_content']));
		const functionRest = ext(value.function, ['name', 'arguments']);
		if (functionRest) setHint(call, 'functionRest', functionRest[API]);
		if (extra !== undefined) setHint(call, 'extraContent', extra);
		return call;
	}
	if (value.type === 'custom' && isRecord(value.custom) && typeof value.custom.name === 'string') {
		const call: GenerateMessageToolCallPart = {
			type: 'tool-call',
			id: value.id,
			name: value.custom.name,
			arguments: typeof value.custom.input === 'string' ? value.custom.input : '',
			toolType: 'custom',
		};
		mergeExtensions(call, ext(value, ['id', 'type', 'custom']));
		const rest = ext(value.custom, ['name', 'input']);
		if (rest) setHint(call, 'customRest', rest[API]);
		return call;
	}
	return { type: 'native', api: API, value };
}

function decodeMessage(value: Wire): GenerateMessage {
	const role = typeof value.role === 'string' ? value.role : 'user';
	const content = decodeContent(value.content);
	let parts = content.parts;
	const message: GenerateMessage = { role, content: parts };
	if (content.shape !== 'missing') setHint(message, 'contentShape', content.shape);
	if (content.shape === 'null') setHint(message, 'contentNull', true);
	if (content.shape === 'missing') setHint(message, 'contentMissing', true);
	if (typeof value.name === 'string') message.name = value.name;
	if (role === 'assistant') {
		const details = decodeReasoningDetails(value);
		if (details.length) parts = [...details, ...parts];
		else if (typeof value.reasoning_content === 'string')
			parts = [{ type: 'reasoning', text: value.reasoning_content }, ...parts];
		message.content = parts;
		if (value.reasoning_content !== undefined) setHint(message, 'reasoningContent', value.reasoning_content);
		if (value.reasoning_details !== undefined) setHint(message, 'reasoningDetails', value.reasoning_details);
		if ('refusal' in value && typeof value.refusal === 'string')
			message.content.push({ type: 'refusal', text: value.refusal });
		if ('refusal' in value) setHint(message, 'refusalPresent', true);
		if (Array.isArray(value.tool_calls)) message.content.push(...value.tool_calls.map(decodeToolCall));
		if ('tool_calls' in value) setHint(message, 'toolCallsPresent', true);
		if (value.function_call !== undefined) setHint(message, 'legacyFunctionCall', value.function_call);
	} else if (role === 'tool' && typeof value.tool_call_id === 'string') {
		const resultContent = typeof value.content === 'string' ? value.content : content.parts;
		message.content = [{ type: 'tool-result', toolCallId: value.tool_call_id, content: resultContent }];
		if (content.shape === 'array') setHint(message.content[0]!, 'toolContentRaw', value.content);
		if (content.shape === 'string') (message.content[0] as { hints?: unknown }).hints = undefined;
		if (content.shape === 'array') setHint(message.content[0]!, 'contentShape', 'array');
	} else if (role === 'function') {
		const id = `function_${typeof value.name === 'string' ? value.name : 'result'}`;
		const result: GenerateMessagePart = {
			type: 'tool-result',
			toolCallId: id,
			name: typeof value.name === 'string' ? value.name : undefined,
			content: typeof value.content === 'string' ? value.content : '',
		};
		message.role = 'tool';
		message.content = [result];
		setHint(message, 'legacyFunction', true);
		setHint(result, 'legacyFunctionId', id);
	}
	const known = [
		'role',
		'content',
		'name',
		'refusal',
		'tool_calls',
		'function_call',
		'tool_call_id',
		'reasoning_content',
		'reasoning_details',
	];
	mergeExtensions(message, ext(value, known));
	return message;
}

function decodeTool(value: Wire): GenerateMessageTool {
	if (value.type === 'function' && isRecord(value.function) && typeof value.function.name === 'string') {
		const tool: GenerateMessageFunctionTool = { type: 'function', name: value.function.name };
		if (typeof value.function.description === 'string') tool.description = value.function.description;
		if ('parameters' in value.function) tool.parameters = value.function.parameters;
		if (typeof value.function.strict === 'boolean') tool.strict = value.function.strict;
		mergeExtensions(tool, ext(value, ['type', 'function']));
		const rest = ext(value.function, ['name', 'description', 'parameters', 'strict']);
		if (rest) setHint(tool, 'functionRest', rest[API]);
		return tool;
	}
	if (value.type === 'custom' && isRecord(value.custom) && typeof value.custom.name === 'string') {
		const tool: GenerateMessageFunctionTool = { type: 'custom', name: value.custom.name };
		if (typeof value.custom.description === 'string') tool.description = value.custom.description;
		if ('format' in value.custom) tool.parameters = value.custom.format;
		mergeExtensions(tool, ext(value, ['type', 'custom']));
		const rest = ext(value.custom, ['name', 'description', 'format']);
		if (rest) setHint(tool, 'customRest', rest[API]);
		return tool;
	}
	return { type: 'native', api: API, value };
}

function decodeResponseFormat(value: unknown, request: GenerateMessageRequest): boolean {
	if (!isRecord(value) || typeof value.type !== 'string') return false;
	if (value.type === 'text' || value.type === 'json_object') {
		request.responseFormat = { type: value.type };
		mergeExtensions(request.responseFormat, ext(value, ['type']));
		return true;
	}
	if (value.type === 'json_schema' && isRecord(value.json_schema) && typeof value.json_schema.name === 'string') {
		const format: GenerateMessageResponseFormat = { type: 'json_schema', name: value.json_schema.name };
		if (typeof value.json_schema.description === 'string') format.description = value.json_schema.description;
		if ('schema' in value.json_schema) format.schema = value.json_schema.schema;
		if (typeof value.json_schema.strict === 'boolean') format.strict = value.json_schema.strict;
		const rest = ext(value.json_schema, ['name', 'description', 'schema', 'strict']);
		if (rest) setHint(format, 'jsonSchemaRest', rest[API]);
		mergeExtensions(format, ext(value, ['type', 'json_schema']));
		request.responseFormat = format;
		return true;
	}
	return false;
}

function decodeRequest(wire: ChatRequest, _ctx: Ctx): GenerateMessageRequest {
	const request: GenerateMessageRequest = { messages: wire.messages.map((message) => decodeMessage(message as Wire)) };
	if (typeof wire.model === 'string') request.model = wire.model;
	if (wire.stream !== undefined) request.stream = wire.stream ?? undefined;
	if (wire.stream === null) setHint(request, 'streamNull', true);
	const raw = wire as Wire;
	const maxKey =
		typeof raw.max_completion_tokens === 'number'
			? 'max_completion_tokens'
			: typeof raw.max_tokens === 'number'
				? 'max_tokens'
				: undefined;
	if (maxKey) {
		request.maxOutputTokens = raw[maxKey] as number;
		setHint(request, 'maxTokensKey', maxKey);
	}
	if (typeof raw.temperature === 'number') request.temperature = raw.temperature;
	if (typeof raw.top_p === 'number') request.topP = raw.top_p;
	if (raw.stop !== undefined && raw.stop !== null) {
		request.stop = Array.isArray(raw.stop) ? raw.stop : [raw.stop as string];
		if (typeof raw.stop === 'string') setHint(request, 'stopString', true);
	}
	if (typeof raw.seed === 'number') request.seed = raw.seed;
	if (typeof raw.n === 'number') request.n = raw.n;
	if (typeof raw.presence_penalty === 'number') request.presencePenalty = raw.presence_penalty;
	if (typeof raw.frequency_penalty === 'number') request.frequencyPenalty = raw.frequency_penalty;
	if (typeof raw.reasoning_effort === 'string') request.reasoning = { effort: raw.reasoning_effort };
	if (typeof raw.user === 'string') request.user = raw.user;
	if (isRecord(raw.metadata) && Object.values(raw.metadata).every((value) => typeof value === 'string'))
		request.metadata = raw.metadata as Record<string, string>;
	if (Array.isArray(raw.tools)) request.tools = raw.tools.map((tool) => decodeTool(tool as Wire));
	if (raw.tool_choice !== undefined) {
		const choice = raw.tool_choice;
		if (choice === 'auto' || choice === 'none' || choice === 'required') request.toolChoice = choice;
		else if (
			isRecord(choice) &&
			choice.type === 'function' &&
			isRecord(choice.function) &&
			typeof choice.function.name === 'string'
		) {
			request.toolChoice = { type: 'tool', name: choice.function.name };
			setHint(request, 'toolChoiceType', 'function');
		} else if (
			isRecord(choice) &&
			choice.type === 'custom' &&
			isRecord(choice.custom) &&
			typeof choice.custom.name === 'string'
		) {
			request.toolChoice = { type: 'tool', name: choice.custom.name };
			setHint(request, 'toolChoiceType', 'custom');
		} else request.toolChoice = { type: 'native', api: API, value: choice };
	}
	if (typeof raw.parallel_tool_calls === 'boolean') request.parallelToolCalls = raw.parallel_tool_calls;
	else if (raw.parallel_tool_calls === null) setHint(request, 'parallelToolCallsNull', true);
	if (raw.response_format !== undefined && !decodeResponseFormat(raw.response_format, request)) {
		mergeExtensions(request, { [API]: { response_format: raw.response_format } });
		setHint(request, 'unknownResponseFormat', true);
	}
	const known = [
		'model',
		'messages',
		'stream',
		'tools',
		'tool_choice',
		'parallel_tool_calls',
		'temperature',
		'top_p',
		'frequency_penalty',
		'presence_penalty',
		'max_tokens',
		'max_completion_tokens',
		'n',
		'stop',
		'seed',
		'response_format',
		'reasoning_effort',
		'user',
		'metadata',
	];
	mergeExtensions(request, ext(raw, known));
	for (const key of known) if (raw[key] === null) setHint(request, `null:${key}`, true);
	if (raw.max_tokens !== undefined && raw.max_completion_tokens !== undefined)
		setHint(request, 'maxTokensFields', {
			max_tokens: raw.max_tokens,
			max_completion_tokens: raw.max_completion_tokens,
		});
	return request;
}

function encodeContentPart(part: GenerateMessagePart, ctx: Ctx, path: string): Wire | undefined {
	switch (part.type) {
		case 'text':
			return applyExt(part, { type: 'text', text: part.text }, ctx, path);
		case 'image': {
			if (part.url === undefined) {
				drop(ctx, path, 'image part needs a URL for OpenAI Chat');
				return undefined;
			}
			const nested: Wire = {
				...(isRecord(hint(part, 'imageUrlRest')) ? hint<Wire>(part, 'imageUrlRest') : {}),
				url: part.url,
			};
			if (part.detail !== undefined) nested.detail = part.detail;
			const imageUrl = hint(part, 'imageUrlString') ? part.url : nested;
			return applyExt(part, { type: 'image_url', image_url: imageUrl }, ctx, path);
		}
		case 'audio': {
			if (part.data === undefined || part.format === undefined) {
				drop(ctx, path, 'audio part needs data and format for OpenAI Chat');
				return undefined;
			}
			const inputAudio = {
				...(isRecord(hint(part, 'inputAudioRest')) ? hint<Wire>(part, 'inputAudioRest') : {}),
				data: part.data,
				format: part.format,
			};
			return applyExt(part, { type: 'input_audio', input_audio: inputAudio }, ctx, path);
		}
		case 'file': {
			const file: Wire = { ...(isRecord(hint(part, 'fileRest')) ? hint<Wire>(part, 'fileRest') : {}) };
			if (part.data !== undefined) file.file_data = part.data;
			if (part.fileId !== undefined) file.file_id = part.fileId;
			if (part.filename !== undefined) file.filename = part.filename;
			if (!Object.keys(file).length) {
				drop(ctx, path, 'file part has no file_data, file_id or filename');
				return undefined;
			}
			return applyExt(part, { type: 'file', file }, ctx, path);
		}
		case 'refusal':
			return applyExt(part, { type: 'refusal', refusal: part.text }, ctx, path);
		case 'native':
			if (part.api === API) return part.value as Wire;
			drop(ctx, path, `${part.api} native content has no ${API} mapping`, part.api);
			return undefined;
		case 'reasoning':
		case 'tool-call':
		case 'tool-result':
			drop(ctx, path, `${part.type} is only valid in an assistant/tool message representation`);
			return undefined;
		default:
			drop(ctx, path, `unknown part type ${(part as { type: string }).type}`);
			return undefined;
	}
}

function encodeReasoningDetails(parts: GenerateMessagePart[], ctx: Ctx, path: string): Wire[] {
	const out: Wire[] = [];
	for (const [index, part] of parts.entries()) {
		if (part.type !== 'reasoning') continue;
		const signature = part.signature;
		const format = signature ? signatureFormat(signature.api) : undefined;
		if (signature && !format && !isChatSignature(signature)) {
			drop(
				ctx,
				`${path}[${index}].signature`,
				`${signature.api} signature has no ${API} reasoning carrier`,
				signature.api,
			);
		}
		if (signature && isChatSignature(signature) && part.redacted) {
			drop(ctx, `${path}[${index}].signature`, 'OpenAI Chat cannot carry opaque Chat reasoning as encrypted data');
		}
		if (part.redacted) {
			if (signature && format) out.push({ type: 'reasoning.encrypted', data: signature.value, format });
			else if (!signature) drop(ctx, `${path}[${index}]`, 'redacted reasoning has no encrypted payload');
			continue;
		}
		const detail: Wire = { type: part.summary?.length ? 'reasoning.summary' : 'reasoning.text' };
		if (part.text !== undefined) detail.text = part.text;
		if (part.summary?.length) detail.summary = part.summary.join('\n\n');
		if (signature && format) {
			detail.signature = signature.value;
			detail.format = format;
		}
		if (!('text' in detail) && !('summary' in detail) && !('signature' in detail)) continue;
		out.push(applyExt(part, detail, ctx, `${path}[${index}]`));
	}
	return out;
}

function encodeToolCall(part: GenerateMessageToolCallPart, ctx: Ctx, path: string): Wire {
	if (part.toolType === 'custom') {
		const custom: Wire = {
			...(isRecord(hint(part, 'customRest')) ? hint<Wire>(part, 'customRest') : {}),
			name: part.name,
			input: part.arguments,
		};
		return applyExt(part, { id: part.id, type: 'custom', custom }, ctx, path);
	}
	const fn: Wire = {
		...(isRecord(hint(part, 'functionRest')) ? hint<Wire>(part, 'functionRest') : {}),
		name: part.name,
		arguments: part.arguments,
	};
	const out: Wire = { id: part.id, type: 'function', function: fn };
	if (part.signature && part.signature.api === ApiType.GoogleGenerativeAI)
		out.extra_content = { google: { thought_signature: part.signature.value } };
	else if (part.signature)
		drop(ctx, `${path}.signature`, `${part.signature.api} tool signature has no ${API} mapping`, part.signature.api);
	const originalExtra = hint<Wire>(part, 'extraContent');
	if (isRecord(originalExtra)) out.extra_content = { ...originalExtra, ...(out.extra_content as Wire | undefined) };
	return applyExt(part, out, ctx, path);
}

function encodeAssistantMessage(message: GenerateMessage, ctx: Ctx, path: string): Wire {
	const out: Wire = { role: 'assistant' };
	if (message.name !== undefined) out.name = message.name;
	const reasoning = message.content.filter((part) => part.type === 'reasoning');
	const nonReasoning = message.content.filter((part) => part.type !== 'reasoning' && part.type !== 'tool-call');
	const texts: GenerateMessagePart[] = nonReasoning.filter((part) => part.type !== 'tool-result');
	if (hint(message, 'contentMissing')) {
		// Keep omitted content when the message contains only tool calls.
	} else if (hint(message, 'contentNull')) out.content = null;
	else if (hint(message, 'contentShape') === 'string' && texts.every((part) => part.type === 'text'))
		out.content = texts.map((part) => (part as { text: string }).text).join('');
	else
		out.content = texts.map((part, index) => encodeContentPart(part, ctx, `${path}.content[${index}]`)).filter(Boolean);
	if (hint(message, 'refusalPresent')) {
		const refusal = message.content.find((part) => part.type === 'refusal');
		out.refusal = refusal?.type === 'refusal' ? refusal.text : null;
	}
	const calls = message.content.filter((part): part is GenerateMessageToolCallPart => part.type === 'tool-call');
	if (calls.length || hint(message, 'toolCallsPresent'))
		out.tool_calls = calls.map((part, index) => encodeToolCall(part, ctx, `${path}.tool_calls[${index}]`));
	if (reasoning.length) {
		const visible = reasoning.flatMap((part) =>
			part.type === 'reasoning' && part.text !== undefined ? [part.text] : [],
		);
		if (hint(message, 'reasoningContent') !== undefined)
			out.reasoning_content = hint<string>(message, 'reasoningContent');
		else if (visible.length) out.reasoning_content = visible.join('');
		const originalDetails = hint<unknown>(message, 'reasoningDetails');
		out.reasoning_details = Array.isArray(originalDetails)
			? originalDetails
			: encodeReasoningDetails(reasoning, ctx, `${path}.reasoning_details`);
	} else if (hint(message, 'reasoningContent') !== undefined)
		out.reasoning_content = hint<string>(message, 'reasoningContent');
	const legacy = hint<unknown>(message, 'legacyFunctionCall');
	if (legacy !== undefined) out.function_call = legacy;
	return applyExt(message, out, ctx, path);
}

function encodeResponseAssistantMessage(message: GenerateMessage, ctx: Ctx, path: string): Wire {
	const out = encodeAssistantMessage(message, ctx, path);
	if ((ctx.source === API && ctx.target === API) || !Array.isArray(out.content)) return out;
	for (const [index, part] of message.content.entries()) {
		if (part.type === 'text' || part.type === 'reasoning' || part.type === 'tool-call' || part.type === 'refusal')
			continue;
		drop(ctx, `${path}.content[${index}]`, `${part.type} cannot be represented in Chat response content`);
	}
	const text = message.content.filter((part) => part.type === 'text').map((part) => part.text);
	out.content = text.length ? text.join('') : null;
	return out;
}

function toolResultText(content: string | GenerateMessagePart[], ctx: Ctx, path: string): string | Wire[] {
	if (typeof content === 'string') return content;
	const raw = content.length && ctx.target === API ? hint<unknown[]>(content[0], 'toolContentRaw') : undefined;
	if (Array.isArray(raw)) return raw as Wire[];
	const parts: Wire[] = [];
	for (const [index, part] of content.entries()) {
		if (part.type === 'text') parts.push({ type: 'text', text: part.text });
		else drop(ctx, `${path}[${index}]`, `${part.type} in tool result has no ${API} mapping`);
	}
	if (!parts.length && ctx.source !== API) {
		ctx.report({ code: 'lossy', path, message: 'Empty tool result content encoded as an empty string' });
		return '';
	}
	return parts;
}

function encodeMessage(message: GenerateMessage, ctx: Ctx, path: string): Wire[] {
	const toolResults = message.content.filter(
		(part): part is Extract<GenerateMessagePart, { type: 'tool-result' }> => part.type === 'tool-result',
	);
	if ((message.role === 'user' || message.role === 'tool') && toolResults.length) {
		const out: Wire[] = [];
		let normal: GenerateMessagePart[] = [];
		const flushNormal = () => {
			if (!normal.length) return;
			if (message.role === 'tool') {
				drop(ctx, path, 'non-tool content in a tool message has no Chat mapping');
				normal = [];
				return;
			}
			out.push(...encodeMessage({ ...message, content: normal }, ctx, path));
			normal = [];
		};
		for (const [index, part] of message.content.entries()) {
			if (part.type !== 'tool-result') {
				normal.push(part);
				continue;
			}
			flushNormal();
			const content = toolResultText(part.content, ctx, `${path}.content[${index}].content`);
			out.push(
				applyExt(message, { role: 'tool', tool_call_id: part.toolCallId, content }, ctx, `${path}.content[${index}]`),
			);
		}
		flushNormal();
		return out;
	}
	if (message.role === 'tool') {
		const result = message.content.find(
			(part): part is Extract<GenerateMessagePart, { type: 'tool-result' }> => part.type === 'tool-result',
		);
		if (result) {
			if (hint(message, 'legacyFunction'))
				return [
					{
						role: 'function',
						name: result.name ?? result.toolCallId,
						content: typeof result.content === 'string' ? result.content : '',
					},
				];
			const content = toolResultText(result.content, ctx, `${path}.content`);
			const out = { role: 'tool', tool_call_id: result.toolCallId, content };
			const extras = message.content.filter((part) => part !== result);
			if (extras.length) drop(ctx, `${path}.content`, 'additional tool message parts have no separate Chat message');
			return [applyExt(message, out, ctx, path)];
		}
	}
	if (message.role === 'assistant') return [encodeAssistantMessage(message, ctx, path)];
	const contentParts = message.content
		.map((part, index) => encodeContentPart(part, ctx, `${path}.content[${index}]`))
		.filter(Boolean);
	const shape = hint(message, 'contentShape');
	const content =
		shape === 'string' && message.content.every((part) => part.type === 'text')
			? message.content.map((part) => (part as { text: string }).text).join('')
			: contentParts.length
				? contentParts
				: '';
	if (!contentParts.length && message.content.length > 0)
		ctx.report({
			code: 'lossy',
			path: `${path}.content`,
			message: 'Unrepresentable content encoded as an empty string',
		});
	if (!sameProtocol(ctx) && !['system', 'developer', 'user', 'assistant', 'tool', 'function'].includes(message.role)) {
		drop(ctx, `${path}.role`, `Message with unsupported Chat role ${message.role} dropped`);
		return [];
	}
	const out: Wire = { role: message.role, content };
	if (message.name !== undefined) out.name = message.name;
	return [applyExt(message, out, ctx, path)];
}

function encodeRequest(request: GenerateMessageRequest, ctx: Ctx): OpenAIChatCompletionsRequest {
	const wire: Wire = { model: request.model ?? ctx.model ?? '', messages: [] };
	const messages: Wire[] = [];
	if (request.system?.length) {
		const systemParts = request.system
			.map((part, index) => encodeContentPart(part, ctx, `system[${index}]`))
			.filter(Boolean);
		if (!systemParts.length)
			ctx.report({
				code: 'lossy',
				path: 'system',
				message: 'Unrepresentable system content encoded as an empty string',
			});
		messages.push({
			role: 'system',
			content: systemParts.length ? systemParts : '',
		});
	}
	for (const [index, message] of request.messages.entries()) {
		const path = `messages[${index}]`;
		if (message.role === 'system' || message.role === 'developer') {
			const encoded = encodeMessage(message, ctx, path)[0];
			const hasConversation = messages.some((item) => item.role !== 'system' && item.role !== 'developer');
			if (!hasConversation) messages.push(encoded);
			else {
				ctx.report({
					code: 'reorder',
					path,
					message: `${message.role} message moved to the beginning of messages`,
					api: API,
				});
				messages.unshift(encoded);
			}
		} else messages.push(...encodeMessage(message, ctx, path));
	}
	if (!messages.length) {
		messages.push({ role: 'user', content: '' });
		ctx.report({
			code: 'default',
			path: 'messages',
			message: 'Chat requires at least one message; inserted an empty user message',
		});
	}
	wire.messages = messages;
	for (const [index, message] of messages.entries()) {
		if (Array.isArray(message.content) && message.content.length === 0) {
			message.content = message.role === 'assistant' ? null : '';
			ctx.report({
				code: 'lossy',
				path: `messages[${index}].content`,
				message: 'Empty Chat content normalized to a schema-compatible value',
			});
		}
	}
	if (request.stream !== undefined) wire.stream = request.stream;
	else if (hint(request, 'streamNull')) wire.stream = null;
	if (request.tools !== undefined) {
		wire.tools = request.tools.flatMap((tool, index) => {
			const path = `tools[${index}]`;
			if (tool.type === 'native') {
				if (tool.api === API && isRecord(tool.value)) return [tool.value];
				drop(ctx, path, `${tool.api} native tool has no ${API} mapping`, tool.api);
				return [];
			}
			if (tool.type === 'custom') {
				const custom: Wire = {
					...(isRecord(hint(tool, 'customRest')) ? hint<Wire>(tool, 'customRest') : {}),
					name: tool.name,
				};
				if (tool.description !== undefined) custom.description = tool.description;
				if (tool.parameters !== undefined) custom.format = tool.parameters;
				return [applyExt(tool, { type: 'custom', custom }, ctx, path)];
			}
			const fn: Wire = {
				...(isRecord(hint(tool, 'functionRest')) ? hint<Wire>(tool, 'functionRest') : {}),
				name: tool.name,
			};
			if (tool.description !== undefined) fn.description = tool.description;
			if (tool.parameters !== undefined) {
				if (isRecord(tool.parameters)) fn.parameters = tool.parameters;
				else
					ctx.report({
						code: 'lossy',
						path: `${path}.parameters`,
						message: 'Non-object function parameters dropped for Chat',
					});
			}
			if (tool.strict !== undefined) fn.strict = tool.strict;
			return [applyExt(tool, { type: 'function', function: fn }, ctx, path)];
		});
	}
	if (request.toolChoice !== undefined) {
		const choice = request.toolChoice;
		if (typeof choice === 'string') wire.tool_choice = choice;
		else if (choice.type === 'tool') {
			const type = hint<string>(request, 'toolChoiceType') ?? 'function';
			wire.tool_choice =
				type === 'custom'
					? { type: 'custom', custom: { name: choice.name } }
					: { type: 'function', function: { name: choice.name } };
		} else if (choice.type === 'native' && choice.api === API) wire.tool_choice = choice.value;
		else drop(ctx, 'toolChoice', `${choice.type === 'native' ? choice.api : 'tool'} choice has no ${API} mapping`);
	}
	if (request.parallelToolCalls !== undefined) wire.parallel_tool_calls = request.parallelToolCalls;
	else if (hint(request, 'parallelToolCallsNull')) wire.parallel_tool_calls = null;
	if (request.temperature !== undefined)
		wire.temperature = clampChatRange(request.temperature, 0, 2, 'temperature', ctx);
	if (request.topP !== undefined) wire.top_p = clampChatRange(request.topP, 0, 1, 'topP', ctx);
	if (request.stop !== undefined) wire.stop = hint(request, 'stopString') ? request.stop[0] : request.stop;
	if (request.seed !== undefined) wire.seed = request.seed;
	if (request.n !== undefined) wire.n = clampChatRange(request.n, 1, 128, 'n', ctx);
	if (request.presencePenalty !== undefined)
		wire.presence_penalty = clampChatRange(request.presencePenalty, -2, 2, 'presencePenalty', ctx);
	if (request.frequencyPenalty !== undefined)
		wire.frequency_penalty = clampChatRange(request.frequencyPenalty, -2, 2, 'frequencyPenalty', ctx);
	if (request.maxOutputTokens !== undefined)
		wire[hint<string>(request, 'maxTokensKey') ?? 'max_completion_tokens'] = request.maxOutputTokens;
	if (request.reasoning?.effort !== undefined) {
		const efforts = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
		if (efforts.includes(request.reasoning.effort)) wire.reasoning_effort = request.reasoning.effort;
		else ctx.report({ code: 'lossy', path: 'reasoning.effort', message: 'Unsupported Chat reasoning effort dropped' });
	}
	if (request.user !== undefined) wire.user = request.user;
	if (request.metadata !== undefined) wire.metadata = request.metadata;
	if (request.responseFormat && !hint(request, 'unknownResponseFormat')) {
		const format = request.responseFormat;
		if (format.type === 'text' || format.type === 'json_object')
			wire.response_format = applyExt(format, { type: format.type }, ctx, 'responseFormat');
		else {
			const schema: Wire = {
				...(isRecord(hint(format, 'jsonSchemaRest')) ? hint<Wire>(format, 'jsonSchemaRest') : {}),
				name: format.name ?? 'response',
			};
			if (format.description !== undefined) schema.description = format.description;
			if (format.schema !== undefined) schema.schema = format.schema;
			if (format.strict !== undefined) schema.strict = format.strict;
			wire.response_format = applyExt(format, { type: 'json_schema', json_schema: schema }, ctx, 'responseFormat');
		}
	}
	for (const key of [
		'stream',
		'tools',
		'tool_choice',
		'parallel_tool_calls',
		'temperature',
		'top_p',
		'frequency_penalty',
		'presence_penalty',
		'max_tokens',
		'max_completion_tokens',
		'n',
		'stop',
		'seed',
		'response_format',
		'reasoning_effort',
		'user',
		'metadata',
	] as const) {
		if (hint(request, `null:${key}`) && !(key in wire)) wire[key] = null;
	}
	const maxTokensFields = hint<Wire>(request, 'maxTokensFields');
	if (maxTokensFields) {
		wire.max_tokens = maxTokensFields.max_tokens;
		wire.max_completion_tokens = maxTokensFields.max_completion_tokens;
	}
	return applyExt(request, wire, ctx, '') as OpenAIChatCompletionsRequest;
}

function clampChatRange(value: number, min: number, max: number, path: string, ctx: Ctx): number {
	const clamped = Math.min(max, Math.max(min, value));
	if (clamped !== value) ctx.report({ code: 'lossy', path, message: `Chat ${path} clamped to ${clamped}` });
	return clamped;
}

function decodeFinishReason(raw: unknown): GenerateMessageFinishReason | undefined {
	if (raw === null || raw === undefined) return undefined;
	switch (raw) {
		case 'stop':
			return 'stop';
		case 'length':
			return 'length';
		case 'tool_calls':
		case 'function_call':
			return 'tool-calls';
		case 'content_filter':
			return 'content-filter';
		default:
			return 'other';
	}
}
function encodeFinishReason(
	reason: GenerateMessageFinishReason | undefined,
	node: GenerateMessageNode | undefined,
): string | null {
	const raw = hint<string | null>(node, 'finishReason');
	if (raw !== undefined && decodeFinishReason(raw) === reason) return raw;
	switch (reason) {
		case 'stop':
			return 'stop';
		case 'length':
			return 'length';
		case 'tool-calls':
			return 'tool_calls';
		case 'content-filter':
			return 'content_filter';
		case undefined:
			return null;
		default:
			return 'stop';
	}
}

function decodeUsage(value: Wire): GenerateMessageUsage {
	const usage: GenerateMessageUsage = {};
	if (typeof value.prompt_tokens === 'number') usage.inputTokens = value.prompt_tokens;
	if (typeof value.completion_tokens === 'number') usage.outputTokens = value.completion_tokens;
	if (typeof value.total_tokens === 'number') usage.totalTokens = value.total_tokens;
	if (isRecord(value.prompt_tokens_details) && typeof value.prompt_tokens_details.cached_tokens === 'number')
		usage.cachedInputTokens = value.prompt_tokens_details.cached_tokens;
	if (isRecord(value.completion_tokens_details) && typeof value.completion_tokens_details.reasoning_tokens === 'number')
		usage.reasoningTokens = value.completion_tokens_details.reasoning_tokens;
	if (isRecord(value.prompt_tokens_details)) {
		const rest = ext(value.prompt_tokens_details, ['cached_tokens']);
		if (rest) mergeExtensions(usage, { [API]: { prompt_tokens_details: rest[API] } });
	}
	if (isRecord(value.completion_tokens_details)) {
		setHint(usage, 'completionTokensDetailsPresent', true);
		const rest = ext(value.completion_tokens_details, ['reasoning_tokens']);
		if (rest) mergeExtensions(usage, { [API]: { completion_tokens_details: rest[API] } });
	}
	mergeExtensions(
		usage,
		ext(value, [
			'prompt_tokens',
			'completion_tokens',
			'total_tokens',
			'prompt_tokens_details',
			'completion_tokens_details',
		]),
	);
	return usage;
}
function encodeUsage(usage: GenerateMessageUsage, ctx: Ctx, path: string): Wire | undefined {
	if (usage.inputTokens === undefined || usage.outputTokens === undefined || usage.totalTokens === undefined) {
		drop(ctx, path, `${API} usage requires inputTokens, outputTokens and totalTokens`);
		return undefined;
	}
	const out: Wire = {
		prompt_tokens: usage.inputTokens,
		completion_tokens: usage.outputTokens,
		total_tokens: usage.totalTokens,
	};
	if (usage.cachedInputTokens !== undefined) out.prompt_tokens_details = { cached_tokens: usage.cachedInputTokens };
	if (usage.reasoningTokens !== undefined) out.completion_tokens_details = { reasoning_tokens: usage.reasoningTokens };
	else if (hint(usage, 'completionTokensDetailsPresent')) out.completion_tokens_details = {};
	const p = ownExt(usage, 'prompt_tokens_details');
	if (isRecord(p)) out.prompt_tokens_details = { ...p, ...(out.prompt_tokens_details as Wire | undefined) };
	const c = ownExt(usage, 'completion_tokens_details');
	if (isRecord(c)) out.completion_tokens_details = { ...c, ...(out.completion_tokens_details as Wire | undefined) };
	return applyExt(usage, out, ctx, path);
}

function decodeResponse(wire: ChatResponse, _ctx: Ctx): GenerateMessageResponse {
	const raw = wire as Wire;
	const response: GenerateMessageResponse = {
		id: typeof raw.id === 'string' ? raw.id : undefined,
		model: typeof raw.model === 'string' ? raw.model : undefined,
		created: typeof raw.created === 'number' ? raw.created : undefined,
		choices: (Array.isArray(raw.choices) ? raw.choices : []).map((choice, position) => {
			const item = choice as Wire;
			const out: GenerateMessageChoice = {
				index: typeof item.index === 'number' ? item.index : position,
				message: decodeMessage(item.message as Wire),
			};
			if (item.finish_reason !== undefined) {
				out.finishReason = decodeFinishReason(item.finish_reason);
				setHint(out, 'finishReason', item.finish_reason);
			}
			mergeExtensions(out, ext(item, ['index', 'message', 'finish_reason', 'logprobs']));
			if ('logprobs' in item) setHint(out, 'logprobs', item.logprobs);
			return out;
		}),
	};
	if (typeof raw.object === 'string') setHint(response, 'object', raw.object);
	if (isRecord(raw.usage)) response.usage = decodeUsage(raw.usage);
	mergeExtensions(response, ext(raw, ['id', 'object', 'created', 'model', 'choices', 'usage']));
	return response;
}

function encodeResponse(response: GenerateMessageResponse, ctx: Ctx): OpenAIChatCompletionsResponse {
	const wire: Wire = {
		id: response.id ?? ctx.generateId('chatcmpl'),
		object: sameProtocol(ctx) ? (hint<string>(response, 'object') ?? 'chat.completion') : 'chat.completion',
		created: normalizeChatCreated(response.created ?? ctx.now(), ctx),
		model: response.model ?? ctx.request?.model ?? ctx.model ?? '',
		choices: response.choices.map((choice, index) => {
			const message =
				choice.message.role === 'assistant'
					? encodeResponseAssistantMessage(choice.message, ctx, `choices[${index}].message`)
					: encodeResponseAssistantMessage({ ...choice.message, role: 'assistant' }, ctx, `choices[${index}].message`);
			const finishReason = encodeFinishReason(choice.finishReason, choice);
			const out: Wire = {
				index: choice.index,
				message: { ...message, role: 'assistant' },
				finish_reason: finishReason ?? 'stop',
			};
			if (finishReason === null)
				ctx.report({
					code: 'default',
					path: `choices[${index}].finish_reason`,
					message: 'Missing Chat finish reason defaulted to stop',
				});
			if (hint(choice, 'logprobs') !== undefined) out.logprobs = hint(choice, 'logprobs');
			return applyExt(choice, out, ctx, `choices[${index}]`);
		}),
	};
	if (response.usage) {
		const usage = encodeUsage(response.usage, ctx, 'usage');
		if (usage) wire.usage = usage;
	}
	return applyExt(response, wire, ctx, '') as OpenAIChatCompletionsResponse;
}

function normalizeChatCreated(value: number, ctx: Ctx): number {
	const normalized = Math.floor(value);
	if (normalized !== value)
		ctx.report({
			code: 'lossy',
			path: 'created',
			message: 'Chat created timestamp must be an integer; fractional part dropped',
		});
	return normalized;
}

interface DecodedChoice {
	next: number;
	open?: { kind: 'text' | 'reasoning' | 'refusal'; index: number; text: string };
	calls: Map<number, { index: number; id: string; name: string; type: 'function' | 'custom'; arguments: string }>;
	finished: boolean;
}

function hasUnknownStreamFields(raw: Wire): boolean {
	if (Object.keys(raw).some((key) => !['id', 'object', 'created', 'model', 'choices', 'usage'].includes(key)))
		return true;
	if (!Array.isArray(raw.choices)) return false;
	return raw.choices.some((value) => {
		if (!isRecord(value)) return true;
		if (Object.keys(value).some((key) => !['index', 'delta', 'finish_reason', 'logprobs'].includes(key))) return true;
		if (!isRecord(value.delta)) return false;
		if (
			Object.keys(value.delta).some(
				(key) => !['function_call', 'role', 'content', 'refusal', 'reasoning_content', 'tool_calls'].includes(key),
			)
		)
			return true;
		if (!Array.isArray(value.delta.tool_calls)) return false;
		return value.delta.tool_calls.some((call) => {
			if (!isRecord(call)) return true;
			if (Object.keys(call).some((key) => !['index', 'id', 'type', 'custom', 'function'].includes(key))) return true;
			if (isRecord(call.function) && Object.keys(call.function).some((key) => !['name', 'arguments'].includes(key)))
				return true;
			return isRecord(call.custom) && Object.keys(call.custom).some((key) => !['name', 'input'].includes(key));
		});
	});
}

function createStreamDecoder(ctx: Ctx) {
	const choices = new Map<number, DecodedChoice>();
	let started = false;
	let usage: GenerateMessageUsage | undefined;
	const state = (choice: number) => {
		let current = choices.get(choice);
		if (!current) {
			current = { next: 0, calls: new Map(), finished: false };
			choices.set(choice, current);
		}
		return current;
	};
	const close = (choice: number, current: DecodedChoice, out: GenerateMessageStreamEvent[]) => {
		if (!current.open) return;
		const open = current.open;
		current.open = undefined;
		const part: GenerateMessagePart = { type: open.kind === 'refusal' ? 'refusal' : open.kind, text: open.text };
		out.push({ type: 'part-end', choice, index: open.index, part });
	};
	return {
		push(chunk: ChatChunk): GenerateMessageStreamEvent[] {
			const raw = chunk as Wire;
			const out: GenerateMessageStreamEvent[] = [];
			if (isRecord(raw.error)) {
				return [{ type: 'error', error: decodeError({ body: raw }) }];
			}
			if (hasUnknownStreamFields(raw)) {
				if (sameProtocol(ctx)) return [{ type: 'native', api: API, value: structuredClone(raw) }];
				ctx.report({
					code: 'drop',
					path: 'stream',
					api: API,
					message: 'Chat stream event contains fields without a common mapping',
				});
			}
			if (!started) {
				started = true;
				const start: Extract<GenerateMessageStreamEvent, { type: 'start' }> = { type: 'start' };
				if (typeof raw.id === 'string') start.id = raw.id;
				if (typeof raw.model === 'string') start.model = raw.model;
				if (typeof raw.created === 'number') start.created = raw.created;
				if (typeof raw.object === 'string') setHint(start, 'object', raw.object);
				mergeExtensions(start, ext(raw, ['id', 'object', 'created', 'model', 'choices', 'usage']));
				out.push(start);
			}
			for (const [position, item] of (Array.isArray(raw.choices) ? raw.choices : []).entries()) {
				const choice = item as Wire;
				const choiceIndex = typeof choice.index === 'number' ? choice.index : position;
				const current = state(choiceIndex);
				if (current.finished) {
					ctx.report({
						code: 'lossy',
						path: `stream.${choiceIndex}.finish`,
						api: API,
						message: 'Repeated Chat stream finish ignored by decoder',
					});
					continue;
				}
				const delta = isRecord(choice.delta) ? choice.delta : {};
				const role = delta.role;
				const textValues: Array<['text' | 'reasoning' | 'refusal', string]> = [];
				if (typeof delta.reasoning_content === 'string') textValues.push(['reasoning', delta.reasoning_content]);
				if (typeof delta.content === 'string') textValues.push(['text', delta.content]);
				if (typeof delta.refusal === 'string') textValues.push(['refusal', delta.refusal]);
				for (const [kind, value] of textValues) {
					if (!current.open || current.open.kind !== kind) {
						close(choiceIndex, current, out);
						current.open = { kind, index: current.next++, text: '' };
						out.push({
							type: 'part-start',
							choice: choiceIndex,
							index: current.open.index,
							role: typeof role === 'string' ? role : 'assistant',
							part: kind === 'refusal' ? { type: 'refusal', text: '' } : { type: kind, text: '' },
						});
					}
					current.open.text += value;
					out.push({
						type: 'part-delta',
						choice: choiceIndex,
						index: current.open.index,
						delta: { [kind === 'reasoning' ? 'text' : 'text']: value },
					});
				}
				const calls = Array.isArray(delta.tool_calls) ? delta.tool_calls : [];
				for (const item of calls) {
					if (!isRecord(item) || typeof item.index !== 'number') continue;
					close(choiceIndex, current, out);
					let call = current.calls.get(item.index);
					const fn = isRecord(item.function) ? item.function : {};
					const custom = isRecord(item.custom) ? item.custom : {};
					if (!call) {
						const type = item.type === 'custom' ? 'custom' : 'function';
						call = {
							index: current.next++,
							id: typeof item.id === 'string' ? item.id : ctx.generateId('call'),
							name: typeof fn.name === 'string' ? fn.name : typeof custom.name === 'string' ? custom.name : '',
							type,
							arguments: '',
						};
						current.calls.set(item.index, call);
						const part: GenerateMessageToolCallPart = {
							type: 'tool-call',
							id: call.id,
							name: call.name,
							arguments: '',
							toolType: call.type,
						};
						out.push({ type: 'part-start', choice: choiceIndex, index: call.index, role: 'assistant', part });
					}
					const args =
						typeof fn.arguments === 'string' ? fn.arguments : typeof custom.input === 'string' ? custom.input : '';
					if (args) {
						call.arguments += args;
						out.push({ type: 'part-delta', choice: choiceIndex, index: call.index, delta: { arguments: args } });
					}
				}
				if (choice.finish_reason !== undefined && choice.finish_reason !== null) {
					close(choiceIndex, current, out);
					for (const call of current.calls.values())
						out.push({
							type: 'part-end',
							choice: choiceIndex,
							index: call.index,
							part: { type: 'tool-call', id: call.id, name: call.name, arguments: call.arguments, toolType: call.type },
						});
					current.calls.clear();
					current.finished = true;
					const finish: GenerateMessageStreamEvent = {
						type: 'finish',
						choice: choiceIndex,
						finishReason: decodeFinishReason(choice.finish_reason),
					};
					setHint(finish, 'finishReason', choice.finish_reason);
					mergeExtensions(finish, ext(choice, ['index', 'delta', 'finish_reason', 'logprobs']));
					out.push(finish);
				}
			}
			if (isRecord(raw.usage)) usage = decodeUsage(raw.usage);
			if (usage && (!Array.isArray(raw.choices) || raw.choices.length === 0)) out.push({ type: 'usage', usage });
			return out;
		},
		end(): GenerateMessageStreamEvent[] {
			const out: GenerateMessageStreamEvent[] = [];
			for (const [choiceIndex, current] of choices) {
				close(choiceIndex, current, out);
				for (const call of current.calls.values())
					out.push({
						type: 'part-end',
						choice: choiceIndex,
						index: call.index,
						part: { type: 'tool-call', id: call.id, name: call.name, arguments: call.arguments, toolType: call.type },
					});
				current.calls.clear();
			}
			if (usage && !out.some((event) => event.type === 'usage')) out.push({ type: 'usage', usage });
			usage = undefined;
			return out;
		},
	};
}

interface EncodedPart {
	part: GenerateMessagePart;
	arguments: string;
	emitted: boolean;
}

function streamToolCall(part: GenerateMessageToolCallPart, index: number, argumentsText: string): Wire {
	return {
		index,
		...(part.id ? { id: part.id } : {}),
		type: 'function',
		function: { name: part.name, arguments: argumentsText },
	};
}

function createStreamEncoder(ctx: Ctx) {
	const parts = new Map<string, EncodedPart>();
	const finished = new Set<number>();
	let startExtensions: Wire | undefined;
	let id: string | undefined;
	let model: string | undefined;
	let created: number | undefined;
	let object: string | undefined;
	let started = false;
	const ensureMeta = () => {
		id ??= ctx.generateId('chatcmpl');
		model ??= ctx.request?.model ?? ctx.model ?? '';
		created ??= ctx.now();
	};
	const chunk = (body: Wire): ChatChunk => {
		ensureMeta();
		const extras = startExtensions;
		startExtensions = undefined;
		return {
			id,
			object: object ?? 'chat.completion.chunk',
			created,
			model,
			choices: [],
			...extras,
			...body,
		} as ChatChunk;
	};
	const textDelta = (
		choice: number,
		entry: EncodedPart,
		text: string | undefined,
		role?: GenerateMessageRole,
	): ChatChunk => {
		const delta: Wire = {};
		if (!started) {
			delta.role = role ?? 'assistant';
			started = true;
		}
		if (entry.part.type === 'reasoning') delta.reasoning_content = text ?? '';
		else if (entry.part.type === 'refusal') delta.refusal = text ?? '';
		else delta.content = text ?? '';
		entry.emitted = true;
		return chunk({ choices: [{ index: choice, delta, finish_reason: null }] });
	};
	return {
		push(event: GenerateMessageStreamEvent): ChatChunk[] {
			switch (event.type) {
				case 'start':
					id = event.id ?? id;
					model = event.model ?? model;
					created = event.created ?? created;
					if (sameProtocol(ctx)) object = hint<string>(event, 'object') ?? object;
					startExtensions = applyExt(event, {}, ctx, 'stream.start');
					return [];
				case 'part-start': {
					const key = `${event.choice}:${event.index}`;
					const entry: EncodedPart = {
						part: event.part,
						arguments: event.part.type === 'tool-call' ? event.part.arguments : '',
						emitted: event.part.type === 'tool-call',
					};
					parts.set(key, entry);
					if (event.part.type === 'text' || event.part.type === 'reasoning' || event.part.type === 'refusal')
						return [textDelta(event.choice, entry, 'text' in event.part ? event.part.text : '', event.role)];
					if (event.part.type === 'tool-call') {
						started = true;
						if (event.part.toolType === 'custom')
							drop(ctx, `stream.${key}.toolType`, 'Custom tool calls use the Chat function stream format');
						const delta: Wire = { role: 'assistant', tool_calls: [] };
						delta.tool_calls = [streamToolCall(event.part, event.index, event.part.arguments)];
						return [chunk({ choices: [{ index: event.choice, delta, finish_reason: null }] })];
					}
					return [];
				}
				case 'part-delta': {
					const key = `${event.choice}:${event.index}`;
					const entry = parts.get(key);
					if (!entry) return [];
					const delta = event.delta;
					if (entry.part.type === 'tool-call' && delta.arguments !== undefined) {
						entry.arguments += delta.arguments;
						const call = streamToolCall(entry.part, event.index, delta.arguments);
						delete call.id;
						if (isRecord(call.function)) delete call.function.name;
						return [chunk({ choices: [{ index: event.choice, delta: { tool_calls: [call] }, finish_reason: null }] })];
					}
					const text = delta.text ?? delta.summary;
					if (
						text !== undefined &&
						(entry.part.type === 'text' || entry.part.type === 'reasoning' || entry.part.type === 'refusal')
					)
						return [textDelta(event.choice, entry, text)];
					if (delta.signature !== undefined)
						drop(ctx, `stream.${key}.signature`, 'Chat stream has no opaque signature delta');
					return [];
				}
				case 'part-end': {
					const key = `${event.choice}:${event.index}`;
					const entry = parts.get(key);
					parts.delete(key);
					if (!entry) return [];
					if (entry.part.type === 'tool-call' && !entry.emitted) {
						entry.emitted = true;
						const call = streamToolCall(entry.part, event.index, entry.arguments);
						return [chunk({ choices: [{ index: event.choice, delta: { tool_calls: [call] }, finish_reason: null }] })];
					}
					return [];
				}
				case 'finish': {
					if (finished.has(event.choice)) {
						ctx.report({
							code: 'lossy',
							path: `stream.${event.choice}.finish`,
							api: API,
							message: 'Repeated Chat stream finish ignored',
						});
						return [];
					}
					finished.add(event.choice);
					const finishChoice = applyExt(
						event,
						{ index: event.choice, delta: {}, finish_reason: encodeFinishReason(event.finishReason, event) },
						ctx,
						`stream.${event.choice}.finish`,
					);
					return [
						chunk({
							choices: [finishChoice],
						}),
					];
				}
				case 'usage': {
					const usage = encodeUsage(event.usage, ctx, 'stream.usage');
					return usage ? [chunk({ choices: [], usage })] : [];
				}
				case 'error': {
					const encoded = encodeError(event.error, ctx);
					return [encoded.body as ChatChunk];
				}
				case 'native':
					if (event.api === API && isRecord(event.value)) return [event.value as ChatChunk];
					drop(ctx, 'stream.native', `${event.api} native event has no ${API} mapping`, event.api);
					return [];
				default:
					return [];
			}
		},
		end(): ChatChunk[] {
			const out: ChatChunk[] = [];
			for (const [key, entry] of parts) {
				const choice = Number(key.split(':')[0]);
				if (entry.part.type === 'tool-call' && !entry.emitted)
					out.push(...this.push({ type: 'part-end', choice, index: Number(key.split(':')[1]), part: entry.part }));
			}
			parts.clear();
			if (!finished.size && started) out.push(chunk({ choices: [{ index: 0, delta: {}, finish_reason: null }] }));
			return out;
		},
	};
}

const KIND_BY_TYPE: Record<string, GenerateMessageErrorKind> = {
	invalid_request_error: 'invalid-request',
	authentication_error: 'authentication',
	permission_error: 'permission',
	not_found_error: 'not-found',
	rate_limit_exceeded: 'rate-limit',
	insufficient_quota: 'rate-limit',
	context_length_exceeded: 'context-length',
	server_error: 'server',
};
const TYPE_BY_KIND: Record<GenerateMessageErrorKind, string> = {
	'invalid-request': 'invalid_request_error',
	authentication: 'authentication_error',
	permission: 'permission_error',
	'not-found': 'not_found_error',
	'rate-limit': 'rate_limit_exceeded',
	'context-length': 'context_length_exceeded',
	server: 'server_error',
	overloaded: 'server_error',
	timeout: 'server_error',
	'content-filter': 'invalid_request_error',
	other: 'server_error',
};
function decodeError(input: { status?: number; body: unknown }): GenerateMessageError {
	const body = input.body;
	if (isRecord(body) && isRecord(body.error)) {
		const inner = body.error;
		const type = typeof inner.type === 'string' ? inner.type : typeof inner.code === 'string' ? inner.code : undefined;
		const error: GenerateMessageError = {
			kind: type ? (KIND_BY_TYPE[type] ?? errorKindFromStatus(input.status)) : errorKindFromStatus(input.status),
			message: typeof inner.message === 'string' ? inner.message : JSON.stringify(inner),
		};
		if (input.status !== undefined) error.status = input.status;
		if (typeof inner.code === 'string') error.code = inner.code;
		if (typeof inner.param === 'string') error.param = inner.param;
		setHint(error, 'errorType', type);
		setHint(error, 'errorExtra', ext(inner, ['message', 'type', 'param', 'code'])?.[API]);
		mergeExtensions(error, ext(body, ['error']));
		return error;
	}
	const error: GenerateMessageError = {
		kind: errorKindFromStatus(input.status),
		message: typeof body === 'string' ? body : JSON.stringify(body),
	};
	if (input.status !== undefined) error.status = input.status;
	return error;
}
function encodeError(error: GenerateMessageError, ctx: Ctx): GenerateMessageWireError {
	const type = hint<string>(error, 'errorType') ?? TYPE_BY_KIND[error.kind] ?? 'server_error';
	const innerExtra = hint<Wire>(error, 'errorExtra');
	const inner: Wire = { ...(isRecord(innerExtra) ? innerExtra : {}), message: error.message, type };
	if (error.param !== undefined) inner.param = error.param;
	if (error.code !== undefined) inner.code = error.code;
	const body = applyExt(error, { error: applyExt(error, inner, ctx, 'error') }, ctx, '');
	return { status: error.status ?? statusFromErrorKind(error.kind), body };
}

export const OpenAIChatCompletionsCodec: GenerateMessageCodec<ChatRequest, ChatResponse, ChatChunk> = {
	api: API,
	decodeRequest,
	encodeRequest,
	decodeResponse,
	encodeResponse,
	createStreamDecoder,
	createStreamEncoder,
	decodeError,
	encodeError,
};

export { OpenAIChatCompletionsChunkSchema, OpenAIChatCompletionsRequestSchema, OpenAIChatCompletionsResponseSchema };
