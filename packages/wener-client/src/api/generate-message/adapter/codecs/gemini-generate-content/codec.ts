import type { z } from 'zod';
import type {
	GeminiContentSchema,
	GeminiFunctionCallSchema,
	GeminiFunctionResponseSchema,
	GeminiGenerateContentRequest,
	GeminiGenerateContentResponse,
	GeminiPartSchema,
	GeminiUsageMetadata,
} from '../../../../gemini-generate-content/schema';
import { ApiType } from '../../../../schema/ApiType';
import type { GenerateMessageCodec, GenerateMessageWireError } from '../../codec';
import type { GenerateMessageAdapterContext } from '../../context';
import type {
	GenerateMessage,
	GenerateMessageChoice,
	GenerateMessageError,
	GenerateMessageErrorKind,
	GenerateMessageExtensions,
	GenerateMessageFinishReason,
	GenerateMessageFunctionTool,
	GenerateMessageNode,
	GenerateMessageOpaque,
	GenerateMessagePart,
	GenerateMessageReasoningConfig,
	GenerateMessageRequest,
	GenerateMessageResponse,
	GenerateMessageResponseFormat,
	GenerateMessageStreamEvent,
	GenerateMessageTool,
	GenerateMessageToolCallPart,
	GenerateMessageToolChoice,
	GenerateMessageUsage,
} from '../../types';
import {
	applyExtensions,
	errorKindFromStatus,
	getHint,
	isRecord,
	mergeExtensions,
	parseJsonObject,
	pickExtensions,
	statusFromErrorKind,
	withHint,
} from '../../utils';

type GeminiPart = z.infer<typeof GeminiPartSchema>;
type GeminiContent = z.infer<typeof GeminiContentSchema>;
type GeminiFunctionCall = z.infer<typeof GeminiFunctionCallSchema>;
type GeminiFunctionResponse = z.infer<typeof GeminiFunctionResponseSchema>;
type GeminiCandidate = NonNullable<GeminiGenerateContentResponse['candidates']>[number];
type Wire = Record<string, unknown>;

const API = ApiType.GoogleGenerativeAI;

/** Gemini API and Vertex share the wire format and thought signatures. */
function isGemini(api: string | undefined): boolean {
	return api === ApiType.GoogleGenerativeAI || api === ApiType.GoogleVertex;
}

function hint<T = unknown>(node: GenerateMessageNode | undefined, key: string): T | undefined {
	return getHint<T>(node, API, key);
}

function setHint<T extends GenerateMessageNode>(node: T, key: string, value: unknown): T {
	return withHint(node, API, key, value);
}

function ext(wire: Wire, known: readonly string[]): GenerateMessageExtensions | undefined {
	return pickExtensions(API, wire, known);
}

function ownExtensions(node: GenerateMessageNode | undefined): Record<string, unknown> | undefined {
	const vertex = node?.extensions?.[ApiType.GoogleVertex];
	const own = node?.extensions?.[API];
	return vertex ? { ...vertex, ...own } : own;
}

/** `applyExtensions` that also treats Vertex extensions as the same protocol. */
function applyExt<T extends Wire>(
	node: GenerateMessageNode | undefined,
	wire: T,
	ctx: GenerateMessageAdapterContext,
	path: string,
): T {
	const extensions = node?.extensions;
	if (!extensions?.[ApiType.GoogleVertex]) return applyExtensions(API, node, wire, ctx, path);
	const { [ApiType.GoogleVertex]: _vertex, ...rest } = extensions;
	return applyExtensions(API, { extensions: { ...rest, [API]: ownExtensions(node) } }, wire, ctx, path);
}

/** Copies fields from `source` that `target` lacks, recursing into nested objects. */
function mergeMissing(target: Wire, source: Wire): void {
	for (const [key, value] of Object.entries(source)) {
		const current = target[key];
		if (!(key in target)) target[key] = value;
		else if (isRecord(current) && isRecord(value)) mergeMissing(current, value);
	}
}

function drop(ctx: GenerateMessageAdapterContext, path: string, message: string, api?: ApiType): void {
	ctx.report({ code: 'drop', path, message, api });
}

function lossy(ctx: GenerateMessageAdapterContext, path: string, message: string): void {
	ctx.report({ code: 'lossy', path, message, api: API });
}

// ---------------------------------------------------------------------------
// Parts

interface DecodeState {
	ctx: GenerateMessageAdapterContext;
	/** Generated ids of calls without an id, by function name, for matching id-less responses. */
	pending: Map<string, string[]>;
}

function newDecodeState(ctx: GenerateMessageAdapterContext): DecodeState {
	return { ctx, pending: new Map() };
}

function signatureOf(value: string | undefined): GenerateMessageOpaque | undefined {
	return value === undefined ? undefined : { api: API, value };
}

function mediaPart(mimeType: string | undefined, source: { data: string } | { url: string }): GenerateMessagePart {
	if (mimeType?.startsWith('image/')) return { type: 'image', ...source, mediaType: mimeType };
	if (mimeType?.startsWith('audio/')) return { type: 'audio', ...source, format: mimeType };
	return { type: 'file', ...source, ...(mimeType === undefined ? {} : { mediaType: mimeType }) };
}

/** Part payloads without a common mapping. */
const NATIVE_PART_KEYS = ['executableCode', 'codeExecutionResult', 'toolCall', 'toolResponse'] as const;

function decodePart(part: GeminiPart, state: DecodeState): GenerateMessagePart {
	const { ctx } = state;
	if (NATIVE_PART_KEYS.some((key) => part[key] !== undefined)) return { type: 'native', api: API, value: part };
	if (part.functionCall) {
		const call = part.functionCall;
		const out: GenerateMessageToolCallPart = {
			type: 'tool-call',
			id: call.id ?? '',
			name: call.name,
			arguments: JSON.stringify(call.args ?? {}),
		};
		if (call.id === undefined) {
			out.id = ctx.generateId('call');
			setHint(out, 'idGenerated', true);
			const queue = state.pending.get(call.name) ?? [];
			queue.push(out.id);
			state.pending.set(call.name, queue);
		}
		const signature = signatureOf(part.thoughtSignature);
		if (signature) out.signature = signature;
		setHint(out, 'functionCall', call);
		mergeExtensions(out, ext(part, ['functionCall', 'thoughtSignature']));
		return out;
	}
	if (part.functionResponse) {
		const response = part.functionResponse;
		let id = response.id;
		const out: GenerateMessagePart = { type: 'tool-result', toolCallId: '', name: response.name, content: '' };
		if (id === undefined) {
			id = state.pending.get(response.name)?.shift() ?? ctx.generateId('call');
			setHint(out, 'idGenerated', true);
		}
		out.toolCallId = id;
		out.content = JSON.stringify(response.response);
		setHint(out, 'functionResponse', response);
		mergeExtensions(out, ext(part, ['functionResponse']));
		return out;
	}
	if (part.inlineData || part.fileData) {
		const inline = part.inlineData;
		const file = part.fileData;
		const mimeType = inline ? inline.mimeType : file?.mimeType;
		let out: GenerateMessagePart;
		if (inline) {
			out = mediaPart(mimeType, inline.data === undefined ? { data: '' } : { data: inline.data });
			if (inline.data === undefined) {
				delete (out as { data?: string }).data;
				setHint(out, 'noData', true);
			}
			setHint(out, 'rest', ext(inline, ['mimeType', 'data'])?.[API]);
		} else {
			const fileUri = file?.fileUri ?? '';
			out = mediaPart(mimeType, { url: fileUri });
			if (fileUri.startsWith('data:')) setHint(out, 'fileData', true);
			if (file) setHint(out, 'rest', ext(file, ['mimeType', 'fileUri'])?.[API]);
		}
		if (mimeType === undefined) setHint(out, 'noMime', true);
		mergeExtensions(out, ext(part, [inline ? 'inlineData' : 'fileData']));
		return out;
	}
	const isText = part.text !== undefined;
	const hasSignature = part.thoughtSignature !== undefined;
	if ((part.thought === true && (isText || hasSignature)) || (!isText && part.thought === undefined && hasSignature)) {
		const out: GenerateMessagePart = { type: 'reasoning' };
		if (part.text !== undefined) out.text = part.text;
		const signature = signatureOf(part.thoughtSignature);
		if (signature) out.signature = signature;
		if (part.thought === undefined) setHint(out, 'signatureOnly', true);
		mergeExtensions(out, ext(part, ['text', 'thought', 'thoughtSignature']));
		return out;
	}
	if (part.text !== undefined) {
		const out: GenerateMessagePart = { type: 'text', text: part.text };
		const signature = signatureOf(part.thoughtSignature);
		if (signature) out.signature = signature;
		if (part.thought === false) setHint(out, 'thoughtFalse', true);
		mergeExtensions(out, ext(part, ['text', 'thought', 'thoughtSignature']));
		return out;
	}
	return { type: 'native', api: API, value: part };
}

interface EncodeEnv {
	ctx: GenerateMessageAdapterContext;
	/** Tool call id → function name, for tool results without a name. */
	toolNames: Map<string, string>;
}

function collectToolNames(messages: readonly GenerateMessage[], into = new Map<string, string>()): Map<string, string> {
	for (const message of messages) {
		for (const part of message.content) if (part.type === 'tool-call') into.set(part.id, part.name);
	}
	return into;
}

function encodeSignature(
	signature: GenerateMessageOpaque | undefined,
	ctx: GenerateMessageAdapterContext,
	path: string,
): string | undefined {
	if (!signature) return undefined;
	if (isGemini(signature.api)) return signature.value;
	drop(ctx, path, `${signature.api} signature cannot be replayed to ${API}`, signature.api);
	return undefined;
}

function toBase64(text: string): string {
	let binary = '';
	for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
	return btoa(binary);
}

function encodeMedia(
	part: GenerateMessageNode & { data?: string; url?: string; fileId?: string },
	mimeType: string | undefined,
	env: EncodeEnv,
	path: string,
): GeminiPart | undefined {
	const { ctx } = env;
	const rest = hint<Wire>(part, 'rest');
	const originalNoMime = hint(part, 'noMime') === true;
	const requireMime = (value: string | undefined) => {
		if (value === undefined && !originalNoMime) lossy(ctx, `${path}.mediaType`, `${API} requires a media type`);
	};
	if (part.fileId !== undefined) drop(ctx, `${path}.fileId`, `file id has no ${API} mapping`);
	let out: GeminiPart;
	if (part.data !== undefined || hint(part, 'noData')) {
		requireMime(mimeType);
		out = { inlineData: { ...rest, ...(mimeType === undefined ? {} : { mimeType }), ...pickData(part.data) } };
	} else if (part.url !== undefined) {
		const match = hint(part, 'fileData') ? undefined : /^data:([^;,]*)((?:;[^;,]*)*),(.*)$/s.exec(part.url);
		if (match) {
			const type = mimeType ?? (match[1] || undefined);
			requireMime(type);
			const isBase64 = match[2]?.split(';').includes('base64');
			const payload = match[3] ?? '';
			const data = isBase64 ? payload : toBase64(decodeURIComponent(payload));
			out = { inlineData: { ...rest, ...(type === undefined ? {} : { mimeType: type }), data } };
		} else {
			requireMime(mimeType);
			out = { fileData: { ...rest, ...(mimeType === undefined ? {} : { mimeType }), fileUri: part.url } };
		}
	} else {
		drop(ctx, path, `media part without data or url has no ${API} mapping`);
		return undefined;
	}
	return applyExt(part, out, ctx, path);
}

function pickData(data: string | undefined): { data?: string } {
	return data === undefined ? {} : { data };
}

function sameJson(a: unknown, b: string): boolean {
	return JSON.stringify(a) === b;
}

function toolResultText(
	content: string | GenerateMessagePart[],
	ctx: GenerateMessageAdapterContext,
	path: string,
): string {
	if (typeof content === 'string') return content;
	const texts: string[] = [];
	content.forEach((part, index) => {
		if (part.type === 'text') texts.push(part.text);
		else drop(ctx, `${path}.content[${index}]`, `${part.type} in tool result has no ${API} mapping`);
	});
	return texts.join('');
}

function encodePart(part: GenerateMessagePart, env: EncodeEnv, path: string): GeminiPart | undefined {
	const { ctx } = env;
	switch (part.type) {
		case 'text': {
			const out: GeminiPart = { text: part.text };
			if (hint(part, 'thoughtFalse')) out.thought = false;
			const signature = encodeSignature(part.signature, ctx, `${path}.signature`);
			if (signature !== undefined) out.thoughtSignature = signature;
			return applyExt(part, out, ctx, path);
		}
		case 'reasoning': {
			const signature = encodeSignature(part.signature, ctx, `${path}.signature`);
			let text = part.text;
			if (part.summary?.length) {
				if (text === undefined) {
					text = part.summary.join('\n\n');
					lossy(ctx, `${path}.summary`, `reasoning summary sent as ${API} thought text`);
				} else {
					drop(ctx, `${path}.summary`, `reasoning summary has no ${API} mapping`);
				}
			}
			if (text === undefined && signature === undefined) {
				drop(ctx, path, `reasoning without text or ${API} signature`);
				return undefined;
			}
			const out: GeminiPart = hint(part, 'signatureOnly') ? {} : { thought: true };
			if (text !== undefined) out.text = text;
			if (signature !== undefined) out.thoughtSignature = signature;
			return applyExt(part, out, ctx, path);
		}
		case 'image':
			if (part.detail !== undefined) drop(ctx, `${path}.detail`, `image detail has no ${API} mapping`);
			return encodeMedia(part, part.mediaType, env, path);
		case 'audio': {
			const format = part.format;
			const mimeType = format === undefined || format.includes('/') ? format : `audio/${format}`;
			return encodeMedia(part, mimeType, env, path);
		}
		case 'file':
			if (part.filename !== undefined) drop(ctx, `${path}.filename`, `file name has no ${API} mapping`);
			return encodeMedia(part, part.mediaType, env, path);
		case 'refusal':
			lossy(ctx, path, `refusal sent as ${API} text`);
			return applyExt(part, { text: part.text }, ctx, path);
		case 'tool-call': {
			const original = hint<GeminiFunctionCall>(part, 'functionCall');
			const idGenerated = hint(part, 'idGenerated') === true;
			let functionCall: GeminiFunctionCall;
			if (
				original &&
				original.name === part.name &&
				sameJson(original.args ?? {}, part.arguments) &&
				(idGenerated || original.id === part.id)
			) {
				functionCall = original;
			} else {
				if (part.toolType === 'custom') lossy(ctx, path, `custom tool call sent as ${API} function call`);
				let args = parseJsonObject(part.arguments);
				if (!args) {
					lossy(ctx, `${path}.arguments`, 'tool call arguments are not a JSON object');
					args = {};
				}
				functionCall = { ...(idGenerated ? {} : { id: part.id }), name: part.name, args };
			}
			const out: GeminiPart = { functionCall };
			const signature = encodeSignature(part.signature, ctx, `${path}.signature`);
			if (signature !== undefined) out.thoughtSignature = signature;
			return applyExt(part, out, ctx, path);
		}
		case 'tool-result': {
			const original = hint<GeminiFunctionResponse>(part, 'functionResponse');
			const idGenerated = hint(part, 'idGenerated') === true;
			let functionResponse: GeminiFunctionResponse;
			if (
				original &&
				typeof part.content === 'string' &&
				original.name === (part.name ?? original.name) &&
				sameJson(original.response, part.content) &&
				(idGenerated || original.id === part.toolCallId)
			) {
				functionResponse = original;
			} else {
				let name = part.name ?? env.toolNames.get(part.toolCallId);
				if (name === undefined) {
					lossy(ctx, `${path}.name`, `${API} function response requires a name; using the tool call id`);
					name = part.toolCallId;
				}
				const text = toolResultText(part.content, ctx, path);
				let parsed: Record<string, unknown> | undefined;
				try {
					const value: unknown = JSON.parse(text);
					if (isRecord(value)) parsed = value;
				} catch {}
				let response: Record<string, unknown>;
				if (part.isError) response = { error: parsed ?? text };
				else if (parsed) response = parsed;
				else {
					lossy(ctx, `${path}.content`, 'tool result is not a JSON object; wrapped as {result}');
					response = { result: text };
				}
				functionResponse = { ...(idGenerated ? {} : { id: part.toolCallId }), name, response };
			}
			return applyExt(part, { functionResponse }, ctx, path);
		}
		case 'native':
			if (isGemini(part.api) && isRecord(part.value)) return part.value as GeminiPart;
			drop(ctx, path, `${part.api} native part has no ${API} mapping`, part.api);
			return undefined;
		default:
			drop(ctx, path, `${(part as { type: string }).type} part has no ${API} mapping`);
			return undefined;
	}
}

function encodeParts(parts: readonly GenerateMessagePart[], env: EncodeEnv, path: string): GeminiPart[] {
	const out: GeminiPart[] = [];
	parts.forEach((part, index) => {
		const encoded = encodePart(part, env, `${path}[${index}]`);
		if (encoded) out.push(encoded);
	});
	return out;
}

// ---------------------------------------------------------------------------
// Contents

function decodeContent(content: GeminiContent, state: DecodeState, defaultRole: string): GenerateMessage {
	const role = content.role === 'model' ? 'assistant' : (content.role ?? defaultRole);
	const message: GenerateMessage = { role, content: (content.parts ?? []).map((part) => decodePart(part, state)) };
	if (content.role === undefined) setHint(message, 'noRole', true);
	if (content.parts === undefined) setHint(message, 'noParts', true);
	mergeExtensions(message, ext(content, ['role', 'parts']));
	return message;
}

function encodeRole(role: string): string {
	if (role === 'assistant') return 'model';
	if (role === 'tool') return 'user';
	return role;
}

function encodeContent(message: GenerateMessage, env: EncodeEnv, path: string): GeminiContent {
	const parts = encodeParts(message.content, env, `${path}.content`);
	const out: GeminiContent = {};
	if (!hint(message, 'noRole')) out.role = encodeRole(message.role);
	if (parts.length || !hint(message, 'noParts')) out.parts = parts;
	if (message.name !== undefined) drop(env.ctx, `${path}.name`, `message name has no ${API} mapping`);
	return applyExt(message, out, env.ctx, path);
}

// ---------------------------------------------------------------------------
// Tools and config

function decodeTools(tools: NonNullable<GeminiGenerateContentRequest['tools']>): GenerateMessageTool[] {
	const out: GenerateMessageTool[] = [];
	tools.forEach((item, group) => {
		const declarations = item.functionDeclarations;
		if (!declarations?.length) {
			out.push({ type: 'native', api: API, value: item });
			return;
		}
		for (const declaration of declarations) {
			const tool: GenerateMessageFunctionTool = { type: 'function', name: declaration.name };
			const known = ['name', 'description'];
			if (declaration.description !== undefined) tool.description = declaration.description;
			const schemaKey =
				declaration.parametersJsonSchema !== undefined
					? 'parametersJsonSchema'
					: declaration.parameters !== undefined
						? 'parameters'
						: undefined;
			if (schemaKey) {
				tool.parameters = declaration[schemaKey];
				known.push(schemaKey);
				setHint(tool, 'schemaKey', schemaKey);
			}
			setHint(tool, 'group', group);
			mergeExtensions(tool, ext(declaration, known));
			out.push(tool);
		}
		const rest = ext(item, ['functionDeclarations'])?.[API];
		if (rest) {
			const native: GenerateMessageTool = { type: 'native', api: API, value: rest };
			out.push(setHint(setHint(native, 'group', group), 'merge', true));
		}
	});
	return out;
}

function encodeTools(tools: readonly GenerateMessageTool[], ctx: GenerateMessageAdapterContext): Wire[] {
	const items: Wire[] = [];
	let last: Wire | undefined;
	let lastKey: unknown;
	tools.forEach((tool, index) => {
		const path = `tools[${index}]`;
		if (tool.type === 'native') {
			if (!isGemini(tool.api) || !isRecord(tool.value)) {
				drop(ctx, path, `${tool.api} native tool has no ${API} mapping`, tool.api);
				return;
			}
			const group = hint(tool, 'group');
			if (hint(tool, 'merge') && last && lastKey === group) {
				mergeMissing(last, tool.value);
				return;
			}
			last = { ...tool.value };
			lastKey = hint(tool, 'merge') ? group : {};
			items.push(last);
			return;
		}
		const declaration: Wire = { name: tool.name };
		if (tool.description !== undefined) declaration.description = tool.description;
		if (tool.type === 'custom') {
			lossy(ctx, path, `custom tool sent as ${API} function without its format`);
		} else if (tool.parameters !== undefined) {
			declaration[hint<string>(tool, 'schemaKey') ?? 'parametersJsonSchema'] = tool.parameters;
		}
		if (tool.strict !== undefined) drop(ctx, `${path}.strict`, `strict has no ${API} mapping`);
		applyExt(tool, declaration, ctx, path);
		const key = hint(tool, 'group') ?? 'default';
		if (last && lastKey === key && Array.isArray(last.functionDeclarations)) {
			last.functionDeclarations.push(declaration);
			return;
		}
		last = { functionDeclarations: [declaration] };
		lastKey = key;
		items.push(last);
	});
	return items;
}

function decodeToolConfig(
	config: NonNullable<GeminiGenerateContentRequest['toolConfig']>,
	request: GenerateMessageRequest,
): Wire | undefined {
	const leftover: Wire = { ...config };
	const calling = config.functionCallingConfig;
	if (calling) {
		const { mode, allowedFunctionNames: names } = calling;
		let choice: GenerateMessageToolChoice | undefined;
		let consumed: string[] = ['mode'];
		if (mode === 'AUTO') choice = 'auto';
		else if (mode === 'NONE') choice = 'none';
		else if (mode === 'ANY' && names?.length === 1 && names[0] !== undefined) {
			choice = { type: 'tool', name: names[0] };
			consumed = ['mode', 'allowedFunctionNames'];
		} else if (mode === 'ANY') choice = 'required';
		else if (mode !== undefined) {
			choice = { type: 'native', api: API, value: calling };
			consumed = Object.keys(calling);
		}
		if (choice) {
			request.toolChoice = choice;
			const rest = ext(calling, consumed)?.[API];
			if (rest) leftover.functionCallingConfig = rest;
			else delete leftover.functionCallingConfig;
		}
	}
	return Object.keys(leftover).length ? leftover : undefined;
}

function encodeToolChoice(choice: GenerateMessageToolChoice, ctx: GenerateMessageAdapterContext): Wire | undefined {
	if (choice === 'auto') return { mode: 'AUTO' };
	if (choice === 'none') return { mode: 'NONE' };
	if (choice === 'required') return { mode: 'ANY' };
	if (choice.type === 'tool') return { mode: 'ANY', allowedFunctionNames: [choice.name] };
	if (isGemini(choice.api) && isRecord(choice.value)) return { ...choice.value };
	drop(ctx, 'toolChoice', `${choice.api} tool choice has no ${API} mapping`, choice.api);
	return undefined;
}

type GenerationConfig = NonNullable<GeminiGenerateContentRequest['generationConfig']>;

function decodeGenerationConfig(config: GenerationConfig, request: GenerateMessageRequest): Wire | undefined {
	const known = [
		'temperature',
		'topP',
		'topK',
		'maxOutputTokens',
		'stopSequences',
		'candidateCount',
		'seed',
		'presencePenalty',
		'frequencyPenalty',
	];
	if (config.temperature !== undefined) request.temperature = config.temperature;
	if (config.topP !== undefined) request.topP = config.topP;
	if (config.topK !== undefined) request.topK = config.topK;
	if (config.maxOutputTokens !== undefined) request.maxOutputTokens = config.maxOutputTokens;
	if (config.stopSequences !== undefined) request.stop = config.stopSequences;
	if (config.candidateCount !== undefined) request.n = config.candidateCount;
	if (config.seed !== undefined) request.seed = config.seed;
	if (config.presencePenalty !== undefined) request.presencePenalty = config.presencePenalty;
	if (config.frequencyPenalty !== undefined) request.frequencyPenalty = config.frequencyPenalty;

	const mime = config.responseMimeType;
	if (mime === 'application/json') {
		const schemaKey =
			config.responseJsonSchema !== undefined
				? 'responseJsonSchema'
				: config.responseSchema !== undefined
					? 'responseSchema'
					: undefined;
		const format: GenerateMessageResponseFormat = { type: schemaKey ? 'json_schema' : 'json_object' };
		if (schemaKey) {
			format.schema = config[schemaKey];
			setHint(format, 'schemaKey', schemaKey);
			known.push(schemaKey);
		}
		request.responseFormat = format;
		known.push('responseMimeType');
	} else if (mime === 'text/plain' && config.responseSchema === undefined && config.responseJsonSchema === undefined) {
		request.responseFormat = { type: 'text' };
		known.push('responseMimeType');
	}

	const thinking = config.thinkingConfig;
	if (thinking) {
		known.push('thinkingConfig');
		const reasoning: GenerateMessageReasoningConfig = {};
		const budget = thinking.thinkingBudget;
		if (budget === -1) {
			reasoning.enabled = true;
			setHint(reasoning, 'dynamicBudget', true);
		} else if (budget !== undefined) {
			reasoning.budgetTokens = budget;
			if (budget === 0) reasoning.enabled = false;
		}
		const thinkingKnown = ['thinkingBudget'];
		if (typeof thinking.thinkingLevel === 'string') {
			reasoning.effort = thinking.thinkingLevel;
			thinkingKnown.push('thinkingLevel');
		}
		mergeExtensions(reasoning, ext(thinking, thinkingKnown));
		request.reasoning = reasoning;
	}
	return ext(config, known)?.[API];
}

function encodeReasoning(reasoning: GenerateMessageReasoningConfig, ctx: GenerateMessageAdapterContext): Wire {
	const out: Wire = {};
	if (reasoning.budgetTokens !== undefined) out.thinkingBudget = reasoning.budgetTokens;
	else if (hint(reasoning, 'dynamicBudget') && reasoning.enabled !== false) out.thinkingBudget = -1;
	else if (reasoning.enabled === false) out.thinkingBudget = 0;
	if (reasoning.effort !== undefined) {
		if (ctx.source === API) out.thinkingLevel = reasoning.effort;
		else {
			const level = {
				minimal: 'MINIMAL',
				low: 'LOW',
				medium: 'MEDIUM',
				high: 'HIGH',
			}[reasoning.effort];
			if (level) out.thinkingLevel = level;
			else lossy(ctx, 'reasoning.effort', `reasoning effort ${reasoning.effort} has no Gemini thinking level mapping`);
		}
	}
	if (reasoning.summary !== undefined && ownExtensions(reasoning)?.includeThoughts === undefined) {
		out.includeThoughts = true;
		lossy(ctx, 'reasoning.summary', `reasoning summary mapped to ${API} includeThoughts`);
	}
	return applyExt(reasoning, out, ctx, 'reasoning');
}

function encodeGenerationConfig(request: GenerateMessageRequest, ctx: GenerateMessageAdapterContext): Wire {
	const out: Wire = {};
	if (request.temperature !== undefined) {
		const value =
			ctx.source === API && ctx.target === API ? request.temperature : Math.min(2, Math.max(0, request.temperature));
		if (value !== request.temperature) lossy(ctx, 'temperature', `temperature clamped to ${value}`);
		out.temperature = value;
	}
	if (request.topP !== undefined) {
		const value = ctx.source === API && ctx.target === API ? request.topP : Math.min(1, Math.max(0, request.topP));
		if (value !== request.topP) lossy(ctx, 'topP', `topP clamped to ${value}`);
		out.topP = value;
	}
	if (request.topK !== undefined) out.topK = request.topK;
	if (request.maxOutputTokens !== undefined) out.maxOutputTokens = request.maxOutputTokens;
	if (request.stop !== undefined) out.stopSequences = request.stop;
	if (request.n !== undefined) out.candidateCount = request.n;
	if (request.seed !== undefined) out.seed = request.seed;
	if (request.presencePenalty !== undefined) out.presencePenalty = request.presencePenalty;
	if (request.frequencyPenalty !== undefined) out.frequencyPenalty = request.frequencyPenalty;
	const format = request.responseFormat;
	if (format) {
		if (format.type === 'text') out.responseMimeType = 'text/plain';
		else {
			out.responseMimeType = 'application/json';
			if (format.type === 'json_schema' && format.schema !== undefined) {
				out[hint<string>(format, 'schemaKey') ?? 'responseJsonSchema'] = format.schema;
			}
		}
		for (const key of ['name', 'description', 'strict'] as const) {
			if (format[key] !== undefined) drop(ctx, `responseFormat.${key}`, `${key} has no ${API} mapping`);
		}
		applyExt(format, out, ctx, 'responseFormat');
	}
	if (request.reasoning) out.thinkingConfig = encodeReasoning(request.reasoning, ctx);
	return out;
}

// ---------------------------------------------------------------------------
// Request

const REQUEST_KNOWN = ['contents', 'systemInstruction', 'tools', 'toolConfig', 'generationConfig'];
const MERGED_CONFIG_KEYS = ['systemInstruction', 'toolConfig', 'generationConfig'] as const;

function decodeRequest(wire: GeminiGenerateContentRequest, ctx: GenerateMessageAdapterContext): GenerateMessageRequest {
	const state = newDecodeState(ctx);
	const request: GenerateMessageRequest = { messages: [] };
	const known = [...REQUEST_KNOWN];
	const bodyModel = typeof wire.model === 'string' ? wire.model : undefined;
	if (bodyModel !== undefined && (ctx.model === undefined || ctx.model === bodyModel)) {
		request.model = bodyModel;
		setHint(request, 'modelInBody', true);
		known.push('model');
	} else if (ctx.model !== undefined) {
		request.model = ctx.model;
	}
	const leftover: Wire = {};
	if (wire.systemInstruction) {
		const system = wire.systemInstruction;
		request.system = (system.parts ?? []).map((part) => decodePart(part, state));
		if (system.parts === undefined) setHint(request, 'systemNoParts', true);
		if (system.role !== undefined) setHint(request, 'systemRole', system.role);
		const rest = ext(system, ['role', 'parts'])?.[API];
		if (rest) leftover.systemInstruction = rest;
	}
	request.messages = wire.contents.map((content) => decodeContent(content, state, 'user'));
	if (wire.tools) request.tools = decodeTools(wire.tools);
	if (wire.toolConfig) {
		setHint(request, 'toolConfig', true);
		const rest = decodeToolConfig(wire.toolConfig, request);
		if (rest) leftover.toolConfig = rest;
	}
	if (wire.generationConfig) {
		setHint(request, 'generationConfig', true);
		const rest = decodeGenerationConfig(wire.generationConfig, request);
		if (rest) leftover.generationConfig = rest;
	}
	mergeExtensions(request, ext(wire, known));
	mergeExtensions(request, Object.keys(leftover).length ? { [API]: leftover } : undefined);
	return request;
}

function encodeRequest(
	request: GenerateMessageRequest,
	ctx: GenerateMessageAdapterContext,
): GeminiGenerateContentRequest {
	const env: EncodeEnv = { ctx, toolNames: collectToolNames(request.messages) };
	const wire: Wire = {};
	if (hint(request, 'modelInBody') && request.model !== undefined) wire.model = request.model;

	let hasSystem = request.system !== undefined;
	const systemParts = request.system ? encodeParts(request.system, env, 'system') : [];
	const contents: GeminiContent[] = [];
	let leading = true;
	let toolContent: GeminiContent | undefined;
	request.messages.forEach((message, index) => {
		const path = `messages[${index}]`;
		if (message.role === 'system' || message.role === 'developer') {
			if (!leading) {
				ctx.report({
					code: 'reorder',
					path,
					message: `${message.role} message moved to ${API} systemInstruction`,
					api: API,
				});
			}
			hasSystem = true;
			systemParts.push(...encodeParts(message.content, env, `${path}.content`));
			if (message.name !== undefined) drop(ctx, `${path}.name`, `message name has no ${API} mapping`);
			applyExt(message, {}, ctx, path);
			toolContent = undefined;
			return;
		}
		leading = false;
		if (message.role === 'tool') {
			const parts = encodeParts(message.content, env, `${path}.content`);
			if (message.name !== undefined) drop(ctx, `${path}.name`, `message name has no ${API} mapping`);
			if (toolContent) {
				toolContent.parts?.push(...parts);
				applyExt(message, toolContent, ctx, path);
				return;
			}
			toolContent = applyExt(message, { role: 'user', parts }, ctx, path);
			contents.push(toolContent);
			return;
		}
		toolContent = undefined;
		contents.push(encodeContent(message, env, path));
	});

	wire.contents = contents;
	if (hasSystem) {
		const system: GeminiContent = {};
		const role = hint<string>(request, 'systemRole');
		if (role !== undefined) system.role = role;
		if (systemParts.length || !hint(request, 'systemNoParts')) system.parts = systemParts;
		wire.systemInstruction = system;
	}
	if (request.tools) wire.tools = encodeTools(request.tools, ctx);
	if (request.toolChoice !== undefined) {
		const calling = encodeToolChoice(request.toolChoice, ctx);
		if (calling) wire.toolConfig = { functionCallingConfig: calling };
	}
	if (!wire.toolConfig && hint(request, 'toolConfig')) wire.toolConfig = {};
	const generationConfig = encodeGenerationConfig(request, ctx);
	if (Object.keys(generationConfig).length || hint(request, 'generationConfig'))
		wire.generationConfig = generationConfig;

	if (request.parallelToolCalls !== undefined)
		drop(ctx, 'parallelToolCalls', `parallelToolCalls has no ${API} mapping`);
	if (request.user !== undefined) drop(ctx, 'user', `user has no ${API} mapping`);
	if (request.metadata !== undefined) drop(ctx, 'metadata', `metadata has no ${API} mapping`);

	const own = ownExtensions(request);
	for (const key of MERGED_CONFIG_KEYS) {
		const current = wire[key];
		const extra = own?.[key];
		if (isRecord(current) && isRecord(extra)) mergeMissing(current, extra);
	}
	return applyExt(request, wire, ctx, '') as GeminiGenerateContentRequest;
}

// ---------------------------------------------------------------------------
// Response

const CONTENT_FILTER_REASONS = new Set(['SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII']);

function decodeFinishReason(raw: string, hasToolCall: boolean): GenerateMessageFinishReason {
	if (raw === 'STOP') return hasToolCall ? 'tool-calls' : 'stop';
	if (raw === 'MAX_TOKENS') return 'length';
	if (CONTENT_FILTER_REASONS.has(raw)) return 'content-filter';
	if (raw === 'MALFORMED_FUNCTION_CALL') return 'error';
	return 'other';
}

function encodeFinishReason(
	reason: GenerateMessageFinishReason,
	node: GenerateMessageNode | undefined,
	hasToolCall: boolean,
): string {
	const raw = hint<string>(node, 'finishReason');
	if (raw !== undefined && decodeFinishReason(raw, hasToolCall) === reason) return raw;
	switch (reason) {
		case 'stop':
		case 'tool-calls':
			return 'STOP';
		case 'length':
			return 'MAX_TOKENS';
		case 'content-filter':
			return 'SAFETY';
		case 'error':
			return 'MALFORMED_FUNCTION_CALL';
		default:
			return 'OTHER';
	}
}

const USAGE_KNOWN = [
	'promptTokenCount',
	'candidatesTokenCount',
	'totalTokenCount',
	'cachedContentTokenCount',
	'thoughtsTokenCount',
];

function decodeUsage(metadata: GeminiUsageMetadata): GenerateMessageUsage {
	const usage: GenerateMessageUsage = {};
	const { promptTokenCount, candidatesTokenCount, thoughtsTokenCount } = metadata;
	if (promptTokenCount !== undefined) usage.inputTokens = promptTokenCount;
	if (candidatesTokenCount !== undefined || thoughtsTokenCount !== undefined) {
		usage.outputTokens = (candidatesTokenCount ?? 0) + (thoughtsTokenCount ?? 0);
		if (candidatesTokenCount === undefined) setHint(usage, 'noCandidatesTokenCount', true);
	}
	if (metadata.totalTokenCount !== undefined) usage.totalTokens = metadata.totalTokenCount;
	if (metadata.cachedContentTokenCount !== undefined) usage.cachedInputTokens = metadata.cachedContentTokenCount;
	if (thoughtsTokenCount !== undefined) usage.reasoningTokens = thoughtsTokenCount;
	mergeExtensions(usage, ext(metadata, USAGE_KNOWN));
	return usage;
}

function encodeUsage(
	usage: GenerateMessageUsage,
	ctx: GenerateMessageAdapterContext,
	path: string,
): GeminiUsageMetadata {
	const out: GeminiUsageMetadata = {};
	if (usage.inputTokens !== undefined) out.promptTokenCount = usage.inputTokens;
	if (usage.outputTokens !== undefined && !hint(usage, 'noCandidatesTokenCount')) {
		out.candidatesTokenCount = usage.outputTokens - (usage.reasoningTokens ?? 0);
	}
	if (usage.totalTokens !== undefined) out.totalTokenCount = usage.totalTokens;
	if (usage.cachedInputTokens !== undefined) out.cachedContentTokenCount = usage.cachedInputTokens;
	if (usage.reasoningTokens !== undefined) out.thoughtsTokenCount = usage.reasoningTokens;
	if (usage.cacheWriteInputTokens !== undefined) {
		drop(ctx, `${path}.cacheWriteInputTokens`, `cache write tokens have no ${API} mapping`);
	}
	return applyExt(usage, out, ctx, path);
}

function hasToolCall(message: GenerateMessage | undefined): boolean {
	return message?.content.some((part) => part.type === 'tool-call') ?? false;
}

function decodeCandidate(candidate: GeminiCandidate, position: number, state: DecodeState): GenerateMessageChoice {
	const choice: GenerateMessageChoice = {
		index: candidate.index ?? position,
		message: candidate.content
			? decodeContent(candidate.content, state, 'assistant')
			: { role: 'assistant', content: [] },
	};
	if (candidate.index === undefined) setHint(choice, 'noIndex', true);
	if (!candidate.content) setHint(choice, 'noContent', true);
	if (candidate.finishReason !== undefined) {
		choice.finishReason = decodeFinishReason(candidate.finishReason, hasToolCall(choice.message));
		setHint(choice, 'finishReason', candidate.finishReason);
	}
	mergeExtensions(choice, ext(candidate, ['content', 'finishReason', 'index']));
	return choice;
}

function encodeCandidate(choice: GenerateMessageChoice, env: EncodeEnv, path: string): GeminiCandidate {
	const out: GeminiCandidate = {};
	const message = choice.message;
	if (message.content.length || !hint(choice, 'noContent')) {
		out.content = encodeContent(message, env, `${path}.message`);
	}
	if (choice.finishReason !== undefined) {
		out.finishReason = encodeFinishReason(choice.finishReason, choice, hasToolCall(message));
	}
	if (!hint(choice, 'noIndex')) out.index = choice.index;
	return applyExt(choice, out, env.ctx, path);
}

function decodeResponse(
	wire: GeminiGenerateContentResponse,
	ctx: GenerateMessageAdapterContext,
): GenerateMessageResponse {
	const state = newDecodeState(ctx);
	const response: GenerateMessageResponse = { choices: [] };
	if (wire.responseId !== undefined) response.id = wire.responseId;
	if (wire.modelVersion !== undefined) response.model = wire.modelVersion;
	if (wire.candidates) response.choices = wire.candidates.map((candidate, i) => decodeCandidate(candidate, i, state));
	else setHint(response, 'noCandidates', true);
	if (wire.usageMetadata) response.usage = decodeUsage(wire.usageMetadata);
	mergeExtensions(response, ext(wire, ['candidates', 'usageMetadata', 'modelVersion', 'responseId']));
	return response;
}

function encodeResponse(
	response: GenerateMessageResponse,
	ctx: GenerateMessageAdapterContext,
): GeminiGenerateContentResponse {
	const toolNames = collectToolNames(ctx.request?.messages ?? []);
	collectToolNames(
		response.choices.map((choice) => choice.message),
		toolNames,
	);
	const env: EncodeEnv = { ctx, toolNames };
	const wire: GeminiGenerateContentResponse = {};
	if (response.choices.length || !hint(response, 'noCandidates')) {
		wire.candidates = response.choices.map((choice, i) => encodeCandidate(choice, env, `choices[${i}]`));
	}
	if (response.usage) wire.usageMetadata = encodeUsage(response.usage, ctx, 'usage');
	if (response.model !== undefined) wire.modelVersion = response.model;
	if (response.id !== undefined) wire.responseId = response.id;
	if (response.created !== undefined) drop(ctx, 'created', `created has no ${API} mapping`);
	return applyExt(response, wire, ctx, '');
}

// ---------------------------------------------------------------------------
// Stream

interface OpenTextPart {
	kind: 'text' | 'reasoning';
	index: number;
	text: string;
	signature?: string;
}

interface DecoderCandidate {
	next: number;
	open?: OpenTextPart;
	sawToolCall: boolean;
	finished: boolean;
}

function createStreamDecoder(ctx: GenerateMessageAdapterContext) {
	const state = newDecodeState(ctx);
	const candidates = new Map<number, DecoderCandidate>();
	let started = false;
	let usage: GenerateMessageUsage | undefined;

	const candidateState = (choice: number) => {
		let current = candidates.get(choice);
		if (!current) {
			current = { next: 0, sawToolCall: false, finished: false };
			candidates.set(choice, current);
		}
		return current;
	};
	const close = (choice: number, current: DecoderCandidate, out: GenerateMessageStreamEvent[]) => {
		const open = current.open;
		if (!open) return;
		current.open = undefined;
		const signature = signatureOf(open.signature);
		const part: GenerateMessagePart = {
			type: open.kind,
			text: open.text,
			...(signature ? { signature } : {}),
		};
		out.push({ type: 'part-end', choice, index: open.index, part });
	};

	return {
		push(chunk: GeminiGenerateContentResponse): GenerateMessageStreamEvent[] {
			const out: GenerateMessageStreamEvent[] = [];
			if (isRecord(chunk.error) && !chunk.candidates) {
				out.push({ type: 'error', error: decodeError({ body: chunk }, ctx) });
				return out;
			}
			const raw = chunk as Wire;
			if (
				Object.keys(raw).some(
					(key) => !['candidates', 'promptFeedback', 'usageMetadata', 'modelVersion', 'responseId'].includes(key),
				)
			) {
				if (ctx.source === API && ctx.target === API)
					return [{ type: 'native', api: API, value: structuredClone(raw) }];
				ctx.report({
					code: 'drop',
					path: 'stream',
					api: API,
					message: 'Gemini stream event contains fields without a common mapping',
				});
			}
			if (!started) {
				started = true;
				const start: GenerateMessageStreamEvent = { type: 'start' };
				if (chunk.responseId !== undefined) start.id = chunk.responseId;
				if (chunk.modelVersion !== undefined) start.model = chunk.modelVersion;
				out.push(start);
			}
			chunk.candidates?.forEach((candidate, position) => {
				const choice = candidate.index ?? position;
				const current = candidateState(choice);
				if (current.finished && candidate.finishReason !== undefined) {
					ctx.report({
						code: 'lossy',
						path: `stream.${choice}.finish`,
						api: API,
						message: 'Repeated Gemini stream finish ignored by decoder',
					});
					return;
				}
				for (const part of candidate.content?.parts ?? []) {
					const kind = part.thought === true ? 'reasoning' : part.text !== undefined ? 'text' : undefined;
					if (kind) {
						let open = current.open;
						if (open?.kind !== kind) {
							close(choice, current, out);
							open = { kind, index: current.next++, text: '' };
							current.open = open;
							out.push({
								type: 'part-start',
								choice,
								index: open.index,
								role: 'assistant',
								part: { type: kind, text: '' },
							});
						}
						// Signature first so a Gemini encoder can attach it to the same chunk's text.
						if (part.thoughtSignature !== undefined) {
							open.signature = (open.signature ?? '') + part.thoughtSignature;
							out.push({
								type: 'part-delta',
								choice,
								index: open.index,
								delta: { signature: part.thoughtSignature },
							});
						}
						if (part.text) {
							open.text += part.text;
							out.push({ type: 'part-delta', choice, index: open.index, delta: { text: part.text } });
						}
						continue;
					}
					close(choice, current, out);
					const decoded = decodePart(part, state);
					const index = current.next++;
					if (decoded.type === 'tool-call') {
						current.sawToolCall = true;
						out.push({
							type: 'part-start',
							choice,
							index,
							role: 'assistant',
							part: { ...decoded, arguments: '' },
						});
						if (decoded.arguments) {
							out.push({ type: 'part-delta', choice, index, delta: { arguments: decoded.arguments } });
						}
					} else {
						out.push({ type: 'part-start', choice, index, role: 'assistant', part: decoded });
					}
					out.push({ type: 'part-end', choice, index, part: decoded });
				}
				if (candidate.finishReason !== undefined) {
					close(choice, current, out);
					const finish: GenerateMessageStreamEvent = {
						type: 'finish',
						choice,
						finishReason: decodeFinishReason(candidate.finishReason, current.sawToolCall),
					};
					setHint(finish, 'finishReason', candidate.finishReason);
					mergeExtensions(finish, ext(candidate, ['content', 'finishReason', 'index']));
					out.push(finish);
					current.finished = true;
				}
			});
			if (chunk.promptFeedback !== undefined) {
				out.push({ type: 'native', api: API, value: { promptFeedback: chunk.promptFeedback } });
			}
			if (chunk.usageMetadata) usage = decodeUsage(chunk.usageMetadata);
			return out;
		},
		end(): GenerateMessageStreamEvent[] {
			const out: GenerateMessageStreamEvent[] = [];
			for (const [choice, current] of candidates) close(choice, current, out);
			if (usage) out.push({ type: 'usage', usage });
			usage = undefined;
			return out;
		},
	};
}

interface EncoderPart {
	part: GenerateMessagePart;
	arguments: string;
	/** Signature delta waiting for the next text chunk or part end. */
	signature?: string;
	signatureApi?: ApiType;
	/** Whether any chunk was emitted for this text-like part. */
	emitted: boolean;
}

const TEXT_LIKE = new Set(['text', 'reasoning', 'refusal']);

function createStreamEncoder(ctx: GenerateMessageAdapterContext) {
	const env: EncodeEnv = { ctx, toolNames: collectToolNames(ctx.request?.messages ?? []) };
	const parts = new Map<string, EncoderPart>();
	const reported = new Set<string>();
	const finished = new Set<number>();
	let pendingFinish: GeminiGenerateContentResponse[] = [];
	let id: string | undefined;
	let model: string | undefined;

	const chunk = (body: GeminiGenerateContentResponse): GeminiGenerateContentResponse => {
		if (model !== undefined) body.modelVersion = model;
		if (id !== undefined) body.responseId = id;
		return body;
	};
	const partChunk = (choice: number, part: GeminiPart) =>
		chunk({ candidates: [{ content: { role: 'model', parts: [part] }, index: choice }] });
	const reportOnce = (key: string, report: () => void) => {
		if (reported.has(key)) return;
		reported.add(key);
		report();
	};
	/** Signatures from deltas belong to the decoded upstream protocol unless the part says otherwise. */
	const acceptSignature = (entry: EncoderPart, key: string, value: string, api: ApiType) => {
		if (!isGemini(api)) {
			reportOnce(`${key}:signature`, () =>
				drop(ctx, `stream.${key}.signature`, `${api} signature cannot be replayed to ${API}`, api),
			);
			return;
		}
		entry.signature = (entry.signature ?? '') + value;
		entry.signatureApi = api;
	};
	const textChunk = (choice: number, entry: EncoderPart, key: string, text: string | undefined) => {
		if (entry.part.type === 'refusal') {
			reportOnce(`${key}:refusal`, () => lossy(ctx, `stream.${key}`, `refusal sent as ${API} text`));
		}
		const part: GeminiPart = entry.part.type === 'reasoning' ? { thought: true } : {};
		if (text !== undefined) part.text = text;
		if (entry.signature !== undefined) {
			part.thoughtSignature = entry.signature;
			entry.signature = undefined;
		}
		entry.emitted = true;
		return partChunk(choice, part);
	};
	const flushFinish = (usage?: GeminiUsageMetadata) => {
		const out = pendingFinish;
		pendingFinish = [];
		const last = out.at(-1);
		if (last && usage) last.usageMetadata = usage;
		return out;
	};
	const finishPart = (choice: number, key: string, entry: EncoderPart, part?: GenerateMessagePart) => {
		let final = part ?? entry.part;
		if (final.type === 'tool-call' && !part) {
			final = { ...final, arguments: entry.arguments };
			if (entry.signature !== undefined) {
				final.signature = { api: entry.signatureApi ?? ctx.target, value: entry.signature };
			}
		}
		const encoded = encodePart(final, env, `stream.${key}`);
		return encoded ? [partChunk(choice, encoded)] : [];
	};

	return {
		push(event: GenerateMessageStreamEvent): GeminiGenerateContentResponse[] {
			switch (event.type) {
				case 'start':
					id = event.id ?? id;
					model = event.model ?? model;
					if (event.created !== undefined) drop(ctx, 'stream.created', `created has no ${API} mapping`);
					return [];
				case 'part-start': {
					const key = `${event.choice}:${event.index}`;
					const part = event.part;
					const entry: EncoderPart = {
						part,
						arguments: part.type === 'tool-call' ? part.arguments : '',
						emitted: false,
					};
					parts.set(key, entry);
					if (!TEXT_LIKE.has(part.type)) return [];
					const signature = 'signature' in part ? part.signature : undefined;
					if (signature) acceptSignature(entry, key, signature.value, signature.api);
					const text = 'text' in part ? part.text : undefined;
					return text ? [textChunk(event.choice, entry, key, text)] : [];
				}
				case 'part-delta': {
					const key = `${event.choice}:${event.index}`;
					const entry = parts.get(key);
					if (!entry) return [];
					const { text, summary, signature, arguments: args } = event.delta;
					if (args !== undefined) entry.arguments += args;
					if (signature !== undefined) acceptSignature(entry, key, signature, ctx.target);
					if (!TEXT_LIKE.has(entry.part.type)) return [];
					const out: GeminiGenerateContentResponse[] = [];
					for (const piece of [text, summary]) {
						if (piece) out.push(textChunk(event.choice, entry, key, piece));
					}
					return out;
				}
				case 'part-end': {
					const key = `${event.choice}:${event.index}`;
					const entry = parts.get(key);
					parts.delete(key);
					if (!entry) {
						if (!event.part) return [];
						const encoded = encodePart(event.part, env, `stream.${key}`);
						return encoded ? [partChunk(event.choice, encoded)] : [];
					}
					if (!TEXT_LIKE.has(entry.part.type)) return finishPart(event.choice, key, entry, event.part);
					// Text was streamed already; emit a trailing signature or the whole part if nothing streamed.
					if (!entry.emitted && event.part && 'text' in event.part && event.part.text) {
						const finalSignature = 'signature' in event.part ? event.part.signature : undefined;
						if (finalSignature && entry.signature === undefined) {
							acceptSignature(entry, key, finalSignature.value, finalSignature.api);
						}
						return [textChunk(event.choice, entry, key, event.part.text)];
					}
					if (entry.signature !== undefined) return [textChunk(event.choice, entry, key, undefined)];
					if (!entry.emitted) {
						const finalSignature = event.part && 'signature' in event.part ? event.part.signature : undefined;
						if (finalSignature) {
							acceptSignature(entry, key, finalSignature.value, finalSignature.api);
							if (entry.signature !== undefined) return [textChunk(event.choice, entry, key, undefined)];
						}
					}
					return [];
				}
				case 'finish': {
					if (finished.has(event.choice)) {
						reportOnce(`finish:${event.choice}`, () =>
							lossy(ctx, `stream.${event.choice}.finish`, 'Repeated Gemini stream finish ignored'),
						);
						return [];
					}
					finished.add(event.choice);
					const candidate: GeminiCandidate = { index: event.choice };
					if (event.finishReason !== undefined) {
						candidate.finishReason = encodeFinishReason(event.finishReason, event, event.finishReason === 'tool-calls');
					}
					applyExt(event, candidate, ctx, `stream.finish[${event.choice}]`);
					pendingFinish.push(chunk({ candidates: [candidate] }));
					return [];
				}
				case 'usage': {
					const usage = encodeUsage(event.usage, ctx, 'stream.usage');
					if (pendingFinish.length) return flushFinish(usage);
					return [chunk({ usageMetadata: usage })];
				}
				case 'error':
					return [...flushFinish(), encodeError(event.error, ctx).body as GeminiGenerateContentResponse];
				case 'native':
					if (isGemini(event.api) && isRecord(event.value)) return [chunk({ ...event.value })];
					drop(ctx, 'stream.native', `${event.api} native event has no ${API} mapping`, event.api);
					return [];
				default:
					return [];
			}
		},
		end(): GeminiGenerateContentResponse[] {
			const out: GeminiGenerateContentResponse[] = [];
			for (const [key, entry] of parts) {
				const choice = Number(key.split(':')[0]);
				if (entry.part.type === 'tool-call') out.push(...finishPart(choice, key, entry));
				else if (TEXT_LIKE.has(entry.part.type) && entry.signature !== undefined) {
					out.push(textChunk(choice, entry, key, undefined));
				}
			}
			parts.clear();
			out.push(...flushFinish());
			return out;
		},
	};
}

// ---------------------------------------------------------------------------
// Errors

const KIND_BY_STATUS: Record<string, GenerateMessageErrorKind> = {
	INVALID_ARGUMENT: 'invalid-request',
	FAILED_PRECONDITION: 'invalid-request',
	OUT_OF_RANGE: 'invalid-request',
	UNAUTHENTICATED: 'authentication',
	PERMISSION_DENIED: 'permission',
	NOT_FOUND: 'not-found',
	RESOURCE_EXHAUSTED: 'rate-limit',
	UNAVAILABLE: 'overloaded',
	DEADLINE_EXCEEDED: 'timeout',
	INTERNAL: 'server',
};

const GEMINI_STATUSES = new Set([
	...Object.keys(KIND_BY_STATUS),
	'CANCELLED',
	'UNKNOWN',
	'ALREADY_EXISTS',
	'ABORTED',
	'UNIMPLEMENTED',
	'DATA_LOSS',
]);

const STATUS_BY_KIND: Record<GenerateMessageErrorKind, string> = {
	'invalid-request': 'INVALID_ARGUMENT',
	'context-length': 'INVALID_ARGUMENT',
	'content-filter': 'INVALID_ARGUMENT',
	authentication: 'UNAUTHENTICATED',
	permission: 'PERMISSION_DENIED',
	'not-found': 'NOT_FOUND',
	'rate-limit': 'RESOURCE_EXHAUSTED',
	overloaded: 'UNAVAILABLE',
	timeout: 'DEADLINE_EXCEEDED',
	server: 'INTERNAL',
	other: 'UNKNOWN',
};

function decodeError(
	input: { status?: number; body: unknown },
	_ctx: GenerateMessageAdapterContext,
): GenerateMessageError {
	let body = input.body;
	const arrayForm = Array.isArray(body) && body.length === 1;
	if (arrayForm) body = (body as unknown[])[0];
	if (isRecord(body) && isRecord(body.error)) {
		const wire = body.error;
		const status = typeof wire.status === 'string' ? wire.status : undefined;
		const code = typeof wire.code === 'number' ? wire.code : undefined;
		const httpStatus = code ?? input.status;
		const error: GenerateMessageError = {
			kind: (status && KIND_BY_STATUS[status]) || errorKindFromStatus(httpStatus),
			message: typeof wire.message === 'string' ? wire.message : '',
		};
		if (httpStatus !== undefined) error.status = httpStatus;
		if (status !== undefined) error.code = status;
		if (arrayForm) setHint(error, 'array', true);
		if (input.status !== undefined && input.status !== httpStatus) setHint(error, 'httpStatus', input.status);
		setHint(error, 'body', ext(body, ['error'])?.[API]);
		mergeExtensions(error, ext(wire, ['code', 'message', 'status']));
		return error;
	}
	const error: GenerateMessageError = {
		kind: errorKindFromStatus(input.status),
		message: typeof body === 'string' ? body : JSON.stringify(body),
	};
	if (input.status !== undefined) error.status = input.status;
	return error;
}

function encodeError(error: GenerateMessageError, ctx: GenerateMessageAdapterContext): GenerateMessageWireError {
	const code = error.status ?? statusFromErrorKind(error.kind);
	let status = STATUS_BY_KIND[error.kind];
	if (error.code !== undefined) {
		if (GEMINI_STATUSES.has(error.code)) status = error.code;
		else drop(ctx, 'error.code', `error code ${error.code} has no ${API} mapping`);
	}
	if (error.param !== undefined) drop(ctx, 'error.param', `error param has no ${API} mapping`);
	const wire = applyExt(error, { code, message: error.message, status }, ctx, 'error');
	const body = { ...hint<Wire>(error, 'body'), error: wire };
	return { status: hint<number>(error, 'httpStatus') ?? code, body: hint(error, 'array') ? [body] : body };
}

function requestPath(request: GenerateMessageRequest, ctx: GenerateMessageAdapterContext): string {
	const model = request.model ?? ctx.model;
	if (!model) throw new Error(`${API} request path requires a model`);
	const base = `/v1beta/models/${encodeURIComponent(model)}`;
	return request.stream ? `${base}:streamGenerateContent?alt=sse` : `${base}:generateContent`;
}

export const GeminiGenerateContentCodec: GenerateMessageCodec<
	GeminiGenerateContentRequest,
	GeminiGenerateContentResponse,
	GeminiGenerateContentResponse
> = {
	api: API,
	decodeRequest,
	encodeRequest,
	decodeResponse,
	encodeResponse,
	createStreamDecoder,
	createStreamEncoder,
	decodeError,
	encodeError,
	requestPath,
};
