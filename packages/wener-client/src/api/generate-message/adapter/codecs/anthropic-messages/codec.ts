import type {
	AnthropicMessagesRequest,
	AnthropicMessagesResponse,
	AnthropicMessagesStreamEvent,
} from '../../../../anthropic-messages/schema';
import { ApiType } from '../../../../schema/ApiType';
import type { GenerateMessageCodec } from '../../codec';
import type { GenerateMessageAdapterContext } from '../../context';
import type {
	GenerateMessage,
	GenerateMessageChoice,
	GenerateMessageError,
	GenerateMessageErrorKind,
	GenerateMessageFilePart,
	GenerateMessageFinishReason,
	GenerateMessageFunctionTool,
	GenerateMessageImagePart,
	GenerateMessageNativePart,
	GenerateMessageNode,
	GenerateMessageOpaque,
	GenerateMessagePart,
	GenerateMessageReasoningConfig,
	GenerateMessageReasoningPart,
	GenerateMessageRequest,
	GenerateMessageResponse,
	GenerateMessageStreamEvent,
	GenerateMessageTextPart,
	GenerateMessageTool,
	GenerateMessageToolCallPart,
	GenerateMessageToolChoice,
	GenerateMessageToolResultPart,
	GenerateMessageUsage,
} from '../../types';
import {
	applyExtensions,
	errorKindFromStatus,
	isRecord,
	mergeExtensions,
	parseJsonObject,
	pickExtensions,
	statusFromErrorKind,
	withHint,
} from '../../utils';

const API = ApiType.AnthropicMessages;
const VERTEX = ApiType.GoogleVertexAnthropicMessages;

type Wire = Record<string, unknown>;
type Ctx = GenerateMessageAdapterContext;
/** Requests replay history and need valid signatures; responses only show reasoning to the client. */
type Mode = 'request' | 'response';
type StreamEvent<T extends GenerateMessageStreamEvent['type']> = Extract<GenerateMessageStreamEvent, { type: T }>;

function sameProtocol(ctx: Ctx): boolean {
	return ctx.source === API && ctx.target === API;
}

function isFamily(api: string | undefined): boolean {
	return api === API || api === VERTEX;
}

function hint<T = unknown>(node: GenerateMessageNode | undefined, key: string): T | undefined {
	return (node?.hints?.[API]?.[key] ?? node?.hints?.[VERTEX]?.[key]) as T | undefined;
}

function hasOwnHints(node: GenerateMessageNode | undefined): boolean {
	return Boolean(node?.hints?.[API] || node?.hints?.[VERTEX]);
}

function ext(node: GenerateMessageNode | undefined, key: string): unknown {
	return node?.extensions?.[API]?.[key] ?? node?.extensions?.[VERTEX]?.[key];
}

/** `applyExtensions` that treats Vertex Anthropic extensions as native. */
function applyExt<T extends Wire>(node: GenerateMessageNode | undefined, wire: T, ctx: Ctx, path: string): T {
	const vertex = node?.extensions?.[VERTEX];
	if (!node?.extensions || !vertex) return applyExtensions(API, node, wire, ctx, path);
	const extensions = { ...node.extensions, [API]: { ...vertex, ...node.extensions[API] } };
	delete extensions[VERTEX];
	return applyExtensions(API, { extensions }, wire, ctx, path);
}

function withExt<T extends GenerateMessageNode>(node: T, wire: Wire, known: readonly string[]): T {
	mergeExtensions(node, pickExtensions(API, wire, known));
	return node;
}

function native(value: unknown): GenerateMessageNativePart {
	return { type: 'native', api: API, value };
}

function dropSignature(ctx: Ctx, path: string, signature: GenerateMessageOpaque): void {
	ctx.report({
		code: 'drop',
		path: `${path}.signature`,
		message: `${signature.api} signature has no Anthropic slot`,
		api: signature.api,
	});
}

// ---------------------------------------------------------------------------
// Content blocks

function decodeMedia(block: Wire, type: 'image' | 'file'): GenerateMessagePart {
	const source = block.source;
	if (!isRecord(source)) return native(block);
	let fields: Partial<GenerateMessageFilePart>;
	let sourceKnown: string[];
	if (source.type === 'base64' && typeof source.data === 'string' && typeof source.media_type === 'string') {
		fields = { data: source.data, mediaType: source.media_type };
		sourceKnown = ['type', 'media_type', 'data'];
	} else if (source.type === 'url' && typeof source.url === 'string') {
		fields = { url: source.url };
		sourceKnown = ['type', 'url'];
	} else if (source.type === 'file' && typeof source.file_id === 'string') {
		fields = { fileId: source.file_id };
		sourceKnown = ['type', 'file_id'];
	} else {
		// Text and content sources carry plain text or nested blocks, not a file payload.
		return native(block);
	}
	const part = { type, ...fields } as GenerateMessageImagePart | GenerateMessageFilePart;
	const known = ['type', 'source'];
	if (part.type === 'file' && typeof block.title === 'string') {
		part.filename = block.title;
		known.push('title');
	}
	withExt(part, block, known);
	const sourceExtras = pickExtensions(API, source, sourceKnown)?.[API];
	if (sourceExtras) mergeExtensions(part, { [API]: { source: sourceExtras } });
	return part;
}

/** Decodes one content block; in streams `tool_use.input` is a placeholder and arguments arrive as deltas. */
function decodeBlock(block: unknown, stream = false): GenerateMessagePart {
	if (!isRecord(block)) return native(block);
	switch (block.type) {
		case 'text':
			if (typeof block.text !== 'string') break;
			return withExt<GenerateMessageTextPart>({ type: 'text', text: block.text }, block, ['type', 'text']);
		case 'image':
			return decodeMedia(block, 'image');
		case 'document':
			return decodeMedia(block, 'file');
		case 'thinking': {
			if (typeof block.thinking !== 'string') break;
			const part: GenerateMessageReasoningPart = { type: 'reasoning', text: block.thinking };
			if (typeof block.signature === 'string') {
				part.signature = { api: API, value: block.signature };
				return withExt(part, block, ['type', 'thinking', 'signature']);
			}
			withHint(part, API, 'unsigned', true);
			return withExt(part, block, ['type', 'thinking']);
		}
		case 'redacted_thinking':
			if (typeof block.data !== 'string') break;
			return withExt<GenerateMessageReasoningPart>(
				{ type: 'reasoning', redacted: true, signature: { api: API, value: block.data } },
				block,
				['type', 'data'],
			);
		case 'tool_use': {
			if (typeof block.id !== 'string' || typeof block.name !== 'string') break;
			const part: GenerateMessageToolCallPart = {
				type: 'tool-call',
				id: block.id,
				name: block.name,
				arguments: stream || block.input === undefined ? '' : JSON.stringify(block.input),
			};
			// Keep the parsed object so same-protocol encoding preserves key order and number formatting.
			if ('input' in block) withHint(part, API, 'input', block.input);
			else withHint(part, API, 'noInput', true);
			return withExt(part, block, ['type', 'id', 'name', 'input']);
		}
		case 'tool_result': {
			const content = block.content;
			if (typeof block.tool_use_id !== 'string') break;
			if (content !== undefined && typeof content !== 'string' && !Array.isArray(content)) break;
			const part: GenerateMessageToolResultPart = {
				type: 'tool-result',
				toolCallId: block.tool_use_id,
				content: Array.isArray(content) ? content.map((item) => decodeBlock(item)) : (content ?? ''),
			};
			if (content === undefined) withHint(part, API, 'noContent', true);
			const known = ['type', 'tool_use_id', 'content'];
			if (typeof block.is_error === 'boolean') {
				part.isError = block.is_error;
				known.push('is_error');
			}
			return withExt(part, block, known);
		}
	}
	return native(block);
}

function dataUrl(url: string): { mediaType: string; data: string } | undefined {
	const match = /^data:([^;,]+);base64,(.*)$/s.exec(url);
	return match ? { mediaType: match[1], data: match[2] } : undefined;
}

function encodeMedia(
	part: GenerateMessageImagePart | GenerateMessageFilePart,
	path: string,
	ctx: Ctx,
): Wire | undefined {
	let source: Wire | undefined;
	const inline = part.url === undefined ? undefined : dataUrl(part.url);
	if (part.data !== undefined && part.mediaType !== undefined) {
		source = { type: 'base64', media_type: part.mediaType, data: part.data };
	} else if (inline) {
		source = { type: 'base64', media_type: inline.mediaType, data: inline.data };
	} else if (part.url !== undefined) {
		source = { type: 'url', url: part.url };
	} else if (part.fileId !== undefined) {
		source = { type: 'file', file_id: part.fileId };
	}
	if (!source) {
		ctx.report({
			code: 'drop',
			path,
			message: `${part.type} part needs data with mediaType, url or fileId for Anthropic`,
		});
		return undefined;
	}
	const sourceExtras = ext(part, 'source');
	const block: Wire = {
		type: part.type === 'image' ? 'image' : 'document',
		source: isRecord(sourceExtras) ? { ...sourceExtras, ...source } : source,
	};
	if (part.type === 'file' && part.filename !== undefined) block.title = part.filename;
	if (part.type === 'image' && part.detail !== undefined) {
		ctx.report({ code: 'drop', path: `${path}.detail`, message: 'Anthropic images have no detail level' });
	}
	return applyExt(part, block, ctx, path);
}

function encodeReasoning(part: GenerateMessageReasoningPart, path: string, ctx: Ctx, mode: Mode): Wire | undefined {
	const signed = part.signature && isFamily(part.signature.api) ? part.signature.value : undefined;
	if (part.redacted) {
		if (signed !== undefined) return applyExt(part, { type: 'redacted_thinking', data: signed }, ctx, path);
		ctx.report({ code: 'drop', path, message: 'redacted reasoning without an Anthropic signature' });
		return undefined;
	}
	// Replayed thinking without a valid signature is rejected upstream, unless it was unsigned on the wire already.
	if (mode === 'request' && signed === undefined && !hint(part, 'unsigned')) {
		ctx.report({
			code: 'drop',
			path,
			message: 'reasoning without an Anthropic signature cannot be replayed as thinking',
			api: part.signature?.api,
		});
		return undefined;
	}
	if (part.signature && signed === undefined) dropSignature(ctx, path, part.signature);
	if (part.text !== undefined && part.summary?.length) {
		ctx.report({ code: 'drop', path: `${path}.summary`, message: 'Anthropic thinking has no separate summary' });
	}
	const block: Wire = { type: 'thinking', thinking: part.text ?? part.summary?.join('\n\n') ?? '' };
	if (signed !== undefined) block.signature = signed;
	return applyExt(part, block, ctx, path);
}

function encodeToolInput(part: GenerateMessageToolCallPart, path: string, ctx: Ctx): unknown {
	const hinted = hint(part, 'input');
	if (hinted !== undefined && JSON.stringify(hinted) === part.arguments) return hinted;
	const parsed = parseJsonObject(part.arguments);
	if (parsed) return parsed;
	ctx.report({
		code: 'lossy',
		path: `${path}.arguments`,
		message: 'tool call arguments are not a JSON object; encoded as {}',
	});
	return {};
}

function encodeToolCall(part: GenerateMessageToolCallPart, path: string, ctx: Ctx): Wire {
	const block: Wire = { type: 'tool_use', id: part.id || ctx.generateId('toolu'), name: part.name };
	if (!(hint(part, 'noInput') && part.arguments === '')) block.input = encodeToolInput(part, path, ctx);
	if (part.signature) dropSignature(ctx, path, part.signature);
	return applyExt(part, block, ctx, path);
}

function encodeToolResult(part: GenerateMessageToolResultPart, path: string, ctx: Ctx, mode: Mode): Wire {
	const block: Wire = { type: 'tool_result', tool_use_id: part.toolCallId };
	if (typeof part.content !== 'string') block.content = encodeParts(part.content, `${path}.content`, ctx, mode);
	else if (!(part.content === '' && hint(part, 'noContent'))) block.content = part.content;
	if (part.isError !== undefined) block.is_error = part.isError;
	// `name` is implied by tool_use_id, so it is not reported as dropped.
	return applyExt(part, block, ctx, path);
}

function encodePart(part: GenerateMessagePart, path: string, ctx: Ctx, mode: Mode): Wire | undefined {
	switch (part.type) {
		case 'text':
			if (part.signature) dropSignature(ctx, path, part.signature);
			return applyExt(part, { type: 'text', text: part.text }, ctx, path);
		case 'refusal':
			ctx.report({ code: 'lossy', path, message: 'refusal encoded as Anthropic text' });
			return applyExt(part, { type: 'text', text: part.text }, ctx, path);
		case 'image':
		case 'file':
			return encodeMedia(part, path, ctx);
		case 'audio':
			ctx.report({ code: 'drop', path, message: 'Anthropic messages do not accept audio' });
			return undefined;
		case 'reasoning':
			return encodeReasoning(part, path, ctx, mode);
		case 'tool-call':
			return encodeToolCall(part, path, ctx);
		case 'tool-result':
			return encodeToolResult(part, path, ctx, mode);
		case 'native':
			if (isFamily(part.api)) return part.value as Wire;
			ctx.report({ code: 'drop', path, message: `${part.api} native content has no Anthropic mapping`, api: part.api });
			return undefined;
		default:
			ctx.report({
				code: 'drop',
				path,
				message: `unknown part type ${(part as { type: string }).type}`,
			});
			return undefined;
	}
}

function encodeParts(parts: GenerateMessagePart[], path: string, ctx: Ctx, mode: Mode): Wire[] {
	const out: Wire[] = [];
	parts.forEach((part, index) => {
		const block = encodePart(part, `${path}[${index}]`, ctx, mode);
		if (block !== undefined) out.push(block);
	});
	return out;
}

function isPlainText(part: GenerateMessagePart): part is Extract<GenerateMessagePart, { type: 'text' }> {
	return part.type === 'text' && !part.extensions && !part.signature;
}

// ---------------------------------------------------------------------------
// Request

const REQUEST_KEYS = [
	'model',
	'max_tokens',
	'messages',
	'system',
	'stream',
	'temperature',
	'top_p',
	'top_k',
	'stop_sequences',
	'tools',
	'tool_choice',
	'metadata',
];

function decodeMessage(wire: Wire): GenerateMessage {
	const content = wire.content;
	const message: GenerateMessage = {
		role: String(wire.role),
		content:
			typeof content === 'string'
				? [{ type: 'text', text: content }]
				: Array.isArray(content)
					? content.map((block) => decodeBlock(block))
					: [],
	};
	if (typeof content === 'string') withHint(message, API, 'content', 'string');
	else if (content === undefined) withHint(message, API, 'contentAbsent', true);
	// Anthropic accepts inline system turns; keep them in place instead of hoisting.
	if (message.role === 'system') withHint(message, API, 'inline', true);
	return withExt(message, wire, ['role', 'content']);
}

function decodeTool(tool: Wire): GenerateMessageTool {
	if (
		(tool.type === undefined || tool.type === 'custom') &&
		typeof tool.name === 'string' &&
		isRecord(tool.input_schema)
	) {
		const out: GenerateMessageFunctionTool = { type: 'function', name: tool.name, parameters: tool.input_schema };
		const known = ['type', 'name', 'input_schema'];
		if (typeof tool.description === 'string') {
			out.description = tool.description;
			known.push('description');
		}
		if (typeof tool.strict === 'boolean') {
			out.strict = tool.strict;
			known.push('strict');
		}
		if (tool.type === 'custom') withHint(out, API, 'type', 'custom');
		return withExt(out, tool, known);
	}
	return { type: 'native', api: API, value: tool };
}

function encodeTool(tool: GenerateMessageTool, path: string, ctx: Ctx): Wire | undefined {
	if (tool.type === 'native') {
		if (isFamily(tool.api)) return tool.value as Wire;
		ctx.report({ code: 'drop', path, message: `${tool.api} native tool has no Anthropic mapping`, api: tool.api });
		return undefined;
	}
	if (tool.type === 'custom') {
		ctx.report({ code: 'drop', path, message: 'custom free-form tools have no Anthropic mapping' });
		return undefined;
	}
	if (tool.parameters !== undefined && !isRecord(tool.parameters)) {
		ctx.report({
			code: 'drop',
			path: `${path}.parameters`,
			message: 'Tool dropped: Anthropic input_schema requires an object',
		});
		return undefined;
	}
	const out: Wire = {};
	if (hint(tool, 'type') === 'custom') out.type = 'custom';
	out.name = tool.name;
	if (tool.description !== undefined) out.description = tool.description;
	if (tool.parameters !== undefined) {
		out.input_schema = tool.parameters;
	} else {
		out.input_schema = { type: 'object', properties: {} };
		ctx.report({
			code: 'default',
			path: `${path}.parameters`,
			message: 'function tool without parameters encoded with an empty object input_schema',
		});
	}
	if (tool.strict !== undefined) out.strict = tool.strict;
	return applyExt(tool, out, ctx, path);
}

function decodeToolChoice(request: GenerateMessageRequest, wire: unknown): void {
	let choice: GenerateMessageToolChoice | undefined;
	if (isRecord(wire)) {
		const allowed =
			wire.type === 'tool' ? ['type', 'name', 'disable_parallel_tool_use'] : ['type', 'disable_parallel_tool_use'];
		const plain =
			Object.keys(wire).every((key) => allowed.includes(key)) &&
			(wire.disable_parallel_tool_use === undefined || typeof wire.disable_parallel_tool_use === 'boolean');
		if (plain) {
			if (wire.type === 'auto') choice = 'auto';
			else if (wire.type === 'any') choice = 'required';
			else if (wire.type === 'none') choice = 'none';
			else if (wire.type === 'tool' && typeof wire.name === 'string') choice = { type: 'tool', name: wire.name };
		}
	}
	if (!choice || !isRecord(wire)) {
		request.toolChoice = { type: 'native', api: API, value: wire };
		return;
	}
	request.toolChoice = choice;
	if (typeof wire.disable_parallel_tool_use === 'boolean') {
		request.parallelToolCalls = !wire.disable_parallel_tool_use;
		withHint(request, API, 'disableParallelToolUse', true);
	}
}

function encodeToolChoice(request: GenerateMessageRequest, ctx: Ctx): Wire | undefined {
	const choice = request.toolChoice;
	let out: Wire | undefined;
	if (choice === 'auto') out = { type: 'auto' };
	else if (choice === 'required') out = { type: 'any' };
	else if (choice === 'none') out = { type: 'none' };
	else if (choice?.type === 'tool') out = { type: 'tool', name: choice.name };
	else if (choice?.type === 'native') {
		if (isFamily(choice.api)) return choice.value as Wire;
		ctx.report({
			code: 'drop',
			path: 'toolChoice',
			message: `${choice.api} tool choice has no Anthropic mapping`,
			api: choice.api,
		});
	}
	const parallel = request.parallelToolCalls;
	if (parallel !== undefined && (hint(request, 'disableParallelToolUse') || parallel === false)) {
		// `auto` is Anthropic's default when tools are present, so it only carries the parallel flag.
		if (!out && request.tools?.length) out = { type: 'auto' };
		if (out) out.disable_parallel_tool_use = !parallel;
	}
	return out;
}

function decodeThinking(thinking: unknown): GenerateMessageReasoningConfig | undefined {
	if (!isRecord(thinking)) return undefined;
	if (thinking.type === 'disabled')
		return withExt<GenerateMessageReasoningConfig>({ enabled: false }, thinking, ['type']);
	if (thinking.type !== 'enabled') return undefined;
	const reasoning: GenerateMessageReasoningConfig = { enabled: true };
	if (typeof thinking.budget_tokens === 'number') {
		reasoning.budgetTokens = thinking.budget_tokens;
		return withExt(reasoning, thinking, ['type', 'budget_tokens']);
	}
	withHint(reasoning, API, 'noBudget', true);
	return withExt(reasoning, thinking, ['type']);
}

function encodeThinking(reasoning: GenerateMessageReasoningConfig | undefined, ctx: Ctx): Wire | undefined {
	if (!reasoning) return undefined;
	if (reasoning.summary !== undefined) {
		ctx.report({ code: 'drop', path: 'reasoning.summary', message: 'Anthropic thinking has no summary setting' });
	}
	let out: Wire | undefined;
	if (reasoning.enabled === false) {
		out = { type: 'disabled' };
	} else if (reasoning.budgetTokens !== undefined) {
		const budget =
			ctx.source === API && ctx.target === API
				? reasoning.budgetTokens
				: Math.max(1024, Math.floor(reasoning.budgetTokens));
		if (budget !== reasoning.budgetTokens)
			ctx.report({
				code: 'lossy',
				path: 'reasoning.budgetTokens',
				message: `Anthropic thinking budget clamped to ${budget}`,
			});
		out = { type: 'enabled', budget_tokens: budget };
		if (reasoning.effort !== undefined) {
			ctx.report({ code: 'drop', path: 'reasoning.effort', message: 'budgetTokens takes precedence over effort' });
		}
	} else if (reasoning.enabled && hint(reasoning, 'noBudget')) {
		out = { type: 'enabled' };
	} else if (reasoning.effort !== undefined || reasoning.enabled) {
		ctx.report({
			code: 'lossy',
			path: 'reasoning',
			message: 'Anthropic thinking needs budget_tokens; effort is not converted to a budget',
		});
	}
	if (!out) {
		applyExt(reasoning, {}, ctx, 'reasoning');
		return undefined;
	}
	return applyExt(reasoning, out, ctx, 'reasoning');
}

function encodeSystemParts(parts: GenerateMessagePart[], path: string, ctx: Ctx): Wire[] {
	const out: Wire[] = [];
	parts.forEach((part, index) => {
		const partPath = `${path}[${index}]`;
		const block = encodePart(part, partPath, ctx, 'request');
		if (!block) return;
		if (block.type !== 'text' && !(part.type === 'native' && isFamily(part.api))) {
			ctx.report({ code: 'drop', path: partPath, message: `${part.type} part is not allowed in Anthropic system` });
			return;
		}
		out.push(block);
	});
	return out;
}

function encodeContent(message: GenerateMessage, path: string, ctx: Ctx, mode: Mode): string | Wire[] {
	if (hint(message, 'content') === 'string' && message.content.every(isPlainText)) {
		return message.content.map((part) => (part as { text: string }).text).join('');
	}
	return encodeParts(message.content, path, ctx, mode);
}

function encodeMessages(request: GenerateMessageRequest, ctx: Ctx): { system?: string | Wire[]; messages: Wire[] } {
	const system: Wire[] = request.system ? encodeSystemParts(request.system, 'system', ctx) : [];
	const messages: Wire[] = [];
	let leading = true;
	let toolTurn: Wire | undefined;
	request.messages.forEach((message, index) => {
		const path = `messages[${index}]`;
		const { role } = message;
		if (!['user', 'assistant', 'system', 'developer', 'tool'].includes(role)) {
			if (sameProtocol(ctx)) {
				const wire: Wire = { role };
				if (!hint(message, 'contentAbsent')) wire.content = encodeContent(message, `${path}.content`, ctx, 'request');
				messages.push(applyExt(message, wire, ctx, path));
				leading = false;
				toolTurn = undefined;
				return;
			}
			ctx.report({
				code: 'drop',
				path: `${path}.role`,
				message: `Message with unsupported Anthropic role ${role} dropped`,
			});
			return;
		}
		if ((role === 'system' || role === 'developer') && !hint(message, 'inline')) {
			if (!leading) {
				ctx.report({ code: 'reorder', path, message: `${role} message moved to Anthropic top-level system` });
			}
			system.push(...encodeSystemParts(message.content, `${path}.content`, ctx));
			if (message.name !== undefined) {
				ctx.report({ code: 'drop', path: `${path}.name`, message: 'Anthropic system has no name' });
			}
			applyExt(message, {}, ctx, path);
			toolTurn = undefined;
			return;
		}
		leading = false;
		// Tool results travel as tool_result blocks in a user turn; adjacent tool messages share one turn,
		// and a user message right after them joins it, since Anthropic expects results and follow-up text together.
		if (role === 'tool' || (role === 'user' && toolTurn)) {
			const blocks = encodeParts(message.content, `${path}.content`, ctx, 'request');
			if (toolTurn) (toolTurn.content as Wire[]).push(...blocks);
			else messages.push((toolTurn = { role: 'user', content: blocks }));
			if (message.name !== undefined && role === 'user') {
				ctx.report({ code: 'drop', path: `${path}.name`, message: 'Anthropic messages have no name' });
			}
			applyExt(message, toolTurn, ctx, path);
			return;
		}
		toolTurn = undefined;
		if (message.name !== undefined) {
			ctx.report({ code: 'drop', path: `${path}.name`, message: 'Anthropic messages have no name' });
		}
		messages.push(
			applyExt(message, { role, content: encodeContent(message, `${path}.content`, ctx, 'request') }, ctx, path),
		);
	});
	if (request.system === undefined && system.length === 0) return { messages };
	const plain = system.every((block) => block.type === 'text' && Object.keys(block).length === 2);
	if (hint(request, 'system') === 'string' && plain) {
		return { system: system.map((block) => block.text).join(''), messages };
	}
	return { system, messages };
}

function decodeRequest(wire: AnthropicMessagesRequest): GenerateMessageRequest {
	const request: GenerateMessageRequest = { messages: wire.messages.map((message) => decodeMessage(message)) };
	const known = [...REQUEST_KEYS];
	if (wire.model !== undefined) request.model = wire.model;
	if (wire.max_tokens !== undefined) request.maxOutputTokens = wire.max_tokens;
	if (typeof wire.system === 'string') {
		request.system = [{ type: 'text', text: wire.system }];
		withHint(request, API, 'system', 'string');
	} else if (Array.isArray(wire.system)) {
		request.system = wire.system.map((block) => decodeBlock(block));
	}
	if (wire.stream !== undefined) request.stream = wire.stream;
	if (wire.temperature !== undefined) request.temperature = wire.temperature;
	if (wire.top_p !== undefined) request.topP = wire.top_p;
	if (wire.top_k !== undefined) request.topK = wire.top_k;
	if (wire.stop_sequences !== undefined) request.stop = wire.stop_sequences;
	if (wire.tools !== undefined) request.tools = wire.tools.map((tool) => decodeTool(tool));
	if (wire.tool_choice !== undefined) decodeToolChoice(request, wire.tool_choice);
	const reasoning = decodeThinking(wire.thinking);
	if (reasoning) {
		request.reasoning = reasoning;
		known.push('thinking');
	}
	withExt(request, wire, known);
	if (isRecord(wire.metadata)) {
		const { user_id: userId, ...rest } = wire.metadata;
		withHint(request, API, 'metadata', true);
		if (typeof userId === 'string') request.user = userId;
		else if (userId === null) withHint(request, API, 'userIdNull', true);
		if (Object.keys(rest).length > 0) mergeExtensions(request, { [API]: { metadata: rest } });
	}
	return request;
}

function encodeRequest(request: GenerateMessageRequest, ctx: Ctx): AnthropicMessagesRequest {
	if (request.maxOutputTokens === undefined) {
		throw new Error(
			'Anthropic Messages requires max_tokens: set maxOutputTokens or register defaultRequestProcessor({ maxOutputTokens })',
		);
	}
	const model = request.model ?? ctx.model;
	if (model === undefined) {
		throw new Error(
			'Anthropic Messages requires model: set request.model or register defaultRequestProcessor({ model })',
		);
	}
	const { system, messages } = encodeMessages(request, ctx);
	const wire: Wire = { model, max_tokens: request.maxOutputTokens };
	if (system !== undefined) wire.system = system;
	wire.messages = messages;
	if (request.stream !== undefined) wire.stream = request.stream;
	if (request.temperature !== undefined) wire.temperature = clampSampling(request.temperature, 'temperature', ctx);
	if (request.topP !== undefined) wire.top_p = clampSampling(request.topP, 'topP', ctx);
	if (request.topK !== undefined) wire.top_k = Math.max(0, request.topK);
	if (request.topK !== undefined && request.topK < 0)
		ctx.report({ code: 'lossy', path: 'topK', message: 'Anthropic top_k clamped to 0' });
	if (request.stop !== undefined) wire.stop_sequences = request.stop;
	if (request.tools !== undefined) {
		const tools: Wire[] = [];
		request.tools.forEach((tool, index) => {
			const out = encodeTool(tool, `tools[${index}]`, ctx);
			if (out) tools.push(out);
		});
		wire.tools = tools;
	}
	const toolChoice = encodeToolChoice(request, ctx);
	if (toolChoice !== undefined) wire.tool_choice = toolChoice;
	const thinking = encodeThinking(request.reasoning, ctx);
	if (thinking !== undefined) wire.thinking = thinking;

	const metadataExtras = ext(request, 'metadata');
	if (request.user !== undefined || isRecord(metadataExtras) || hint(request, 'metadata')) {
		const metadata: Wire = isRecord(metadataExtras) ? { ...metadataExtras } : {};
		if (request.user !== undefined) metadata.user_id = request.user;
		else if (hint(request, 'userIdNull')) metadata.user_id = null;
		wire.metadata = metadata;
	}
	if (request.metadata && Object.keys(request.metadata).length > 0) {
		ctx.report({ code: 'drop', path: 'metadata', message: 'Anthropic metadata only supports user_id' });
	}
	for (const key of ['seed', 'presencePenalty', 'frequencyPenalty'] as const) {
		if (request[key] !== undefined) {
			ctx.report({ code: 'drop', path: key, message: `Anthropic Messages has no ${key}` });
		}
	}
	if (request.n !== undefined && request.n !== 1) {
		ctx.report({ code: 'drop', path: 'n', message: 'Anthropic Messages returns a single message' });
	}
	if (request.responseFormat && request.responseFormat.type !== 'text') {
		ctx.report({ code: 'drop', path: 'responseFormat', message: 'responseFormat has no Anthropic Messages mapping' });
	}
	return applyExt(request, wire, ctx, '') as AnthropicMessagesRequest;
}

function clampSampling(value: number, path: string, ctx: Ctx): number {
	const clamped = Math.min(1, Math.max(0, value));
	if (clamped !== value) {
		ctx.report({
			code: 'lossy',
			path,
			message: `${path} is outside Anthropic's [0, 1] range; clamped to ${clamped}`,
		});
	}
	return clamped;
}

// ---------------------------------------------------------------------------
// Response

const RESPONSE_KEYS = ['id', 'type', 'role', 'content', 'model', 'stop_reason', 'usage'];

function decodeStopReason(reason: unknown): GenerateMessageFinishReason | undefined {
	switch (reason) {
		case null:
		case undefined:
			return undefined;
		case 'end_turn':
		case 'stop_sequence':
			return 'stop';
		case 'max_tokens':
		case 'model_context_window_exceeded':
			return 'length';
		case 'tool_use':
			return 'tool-calls';
		case 'refusal':
			return 'content-filter';
		default:
			return 'other';
	}
}

function encodeStopReason(
	finishReason: GenerateMessageFinishReason | undefined,
	raw: unknown,
	stopSequence: unknown,
	ctx: Ctx,
	path: string,
): string | null {
	if (raw !== undefined && decodeStopReason(raw) === finishReason) return raw as string | null;
	switch (finishReason) {
		case undefined:
			return null;
		case 'stop':
			return typeof stopSequence === 'string' ? 'stop_sequence' : 'end_turn';
		case 'length':
			return 'max_tokens';
		case 'tool-calls':
			return 'tool_use';
		case 'content-filter':
			return 'refusal';
		default:
			ctx.report({ code: 'lossy', path, message: `finish reason ${finishReason} encoded as end_turn` });
			return 'end_turn';
	}
}

const USAGE_TOKEN_KEYS = ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens'];

function decodeUsage(wire: Wire): GenerateMessageUsage {
	const usage: GenerateMessageUsage = {};
	const known: string[] = [];
	const nulls: string[] = [];
	const values: Record<string, number | undefined> = {};
	for (const key of USAGE_TOKEN_KEYS) {
		const value = wire[key];
		if (typeof value === 'number') values[key] = value;
		else if (value === null) nulls.push(key);
		else continue;
		known.push(key);
	}
	const read = values.cache_read_input_tokens;
	const write = values.cache_creation_input_tokens;
	if (values.input_tokens !== undefined) usage.inputTokens = values.input_tokens + (read ?? 0) + (write ?? 0);
	if (values.output_tokens !== undefined) usage.outputTokens = values.output_tokens;
	if (usage.inputTokens !== undefined && usage.outputTokens !== undefined) {
		usage.totalTokens = usage.inputTokens + usage.outputTokens;
	}
	if (read !== undefined) usage.cachedInputTokens = read;
	if (write !== undefined) usage.cacheWriteInputTokens = write;
	const details = wire.output_tokens_details;
	if (isRecord(details) && typeof details.thinking_tokens === 'number') usage.reasoningTokens = details.thinking_tokens;
	if (nulls.length > 0) withHint(usage, API, 'nulls', nulls);
	return withExt(usage, wire, known);
}

function encodeUsage(usage: GenerateMessageUsage | undefined, ctx: Ctx, path: string, required: boolean): Wire {
	const out: Wire = {};
	const read = nonnegative(usage?.cachedInputTokens, `${path}.cachedInputTokens`, ctx);
	const write = nonnegative(usage?.cacheWriteInputTokens, `${path}.cacheWriteInputTokens`, ctx);
	if (usage?.inputTokens !== undefined) {
		out.input_tokens = nonnegative(usage.inputTokens - (read ?? 0) - (write ?? 0), `${path}.inputTokens`, ctx);
	}
	if (usage?.outputTokens !== undefined)
		out.output_tokens = nonnegative(usage.outputTokens, `${path}.outputTokens`, ctx);
	if (read !== undefined) out.cache_read_input_tokens = read;
	if (write !== undefined) out.cache_creation_input_tokens = write;
	for (const key of hint<string[]>(usage, 'nulls') ?? []) {
		if (!(key in out)) out[key] = null;
	}
	if (usage?.reasoningTokens !== undefined && ext(usage, 'output_tokens_details') === undefined) {
		out.output_tokens_details = { thinking_tokens: nonnegative(usage.reasoningTokens, `${path}.reasoningTokens`, ctx) };
	}
	// totalTokens is input + output and has no field of its own.
	applyExt(usage, out, ctx, path);
	if (required) {
		// Anthropic requires both counts; 0 is a protocol placeholder when the source has no usage, not a measurement.
		out.input_tokens ??= 0;
		out.output_tokens ??= 0;
	}
	return out;
}

function nonnegative(value: number | undefined, path: string, ctx: Ctx): number | undefined {
	if (value === undefined || value >= 0) return value;
	ctx.report({ code: 'lossy', path, message: 'Negative token count clamped to 0' });
	return 0;
}

function decodeResponse(wire: AnthropicMessagesResponse): GenerateMessageResponse {
	const choice: GenerateMessageChoice = {
		index: 0,
		message: { role: wire.role, content: wire.content.map((block) => decodeBlock(block)) },
	};
	const finishReason = decodeStopReason(wire.stop_reason);
	if (finishReason) choice.finishReason = finishReason;
	withHint(choice, API, 'stopReason', wire.stop_reason);
	const response: GenerateMessageResponse = { id: wire.id, model: wire.model, choices: [choice] };
	withHint(response, API, 'type', wire.type);
	if (isRecord(wire.usage)) response.usage = decodeUsage(wire.usage);
	return withExt(response, wire, RESPONSE_KEYS);
}

function encodeResponse(response: GenerateMessageResponse, ctx: Ctx): AnthropicMessagesResponse {
	response.choices.slice(1).forEach((choice) => {
		ctx.report({
			code: 'drop',
			path: `choices[${choice.index}]`,
			message: 'Anthropic Messages returns a single message',
		});
	});
	const choice = response.choices[0];
	const message = choice?.message;
	if (message?.name !== undefined) {
		ctx.report({ code: 'drop', path: 'choices[0].message.name', message: 'Anthropic messages have no name' });
	}
	applyExt(choice, {}, ctx, 'choices[0]');
	applyExt(message, {}, ctx, 'choices[0].message');
	// `created` is informational and Anthropic has no timestamp field, so it is not reported.
	const wire: Wire = {
		id: response.id ?? ctx.generateId('msg'),
		type: ctx.source === API && ctx.target === API ? (hint<string>(response, 'type') ?? 'message') : 'message',
		role: 'assistant',
		content: message ? encodeParts(message.content, 'choices[0].message.content', ctx, 'response') : [],
		model: response.model ?? ctx.request?.model ?? ctx.model ?? '',
		stop_reason: encodeStopReason(
			choice?.finishReason,
			hint(choice, 'stopReason'),
			ext(response, 'stop_sequence'),
			ctx,
			'choices[0].finishReason',
		),
		usage: encodeUsage(response.usage, ctx, 'usage', true),
	};
	applyExt(response, wire, ctx, '');
	if (!('stop_sequence' in wire)) wire.stop_sequence = null;
	return wire as AnthropicMessagesResponse;
}

// ---------------------------------------------------------------------------
// Errors

const ERROR_KINDS: Record<string, GenerateMessageErrorKind> = {
	invalid_request_error: 'invalid-request',
	authentication_error: 'authentication',
	permission_error: 'permission',
	not_found_error: 'not-found',
	request_too_large: 'context-length',
	rate_limit_error: 'rate-limit',
	api_error: 'server',
	overloaded_error: 'overloaded',
};

const ERROR_STATUS: Record<string, number> = {
	invalid_request_error: 400,
	authentication_error: 401,
	permission_error: 403,
	not_found_error: 404,
	request_too_large: 413,
	rate_limit_error: 429,
	api_error: 500,
	overloaded_error: 529,
};

const ERROR_TYPES: Record<GenerateMessageErrorKind, string> = {
	'invalid-request': 'invalid_request_error',
	authentication: 'authentication_error',
	permission: 'permission_error',
	'not-found': 'not_found_error',
	// Anthropic reports prompt overflow as a 400 invalid_request_error; request_too_large is about body size.
	'context-length': 'invalid_request_error',
	'content-filter': 'invalid_request_error',
	'rate-limit': 'rate_limit_error',
	overloaded: 'overloaded_error',
	server: 'api_error',
	timeout: 'api_error',
	other: 'api_error',
};

const CONTEXT_LENGTH_MESSAGE = /prompt is too long|context window|context length/i;

function errorKind(type: string, message: string, status: number | undefined): GenerateMessageErrorKind {
	if (type === 'invalid_request_error' && CONTEXT_LENGTH_MESSAGE.test(message)) return 'context-length';
	if (type === 'api_error' && status !== undefined && status !== 500) return errorKindFromStatus(status);
	return ERROR_KINDS[type] ?? errorKindFromStatus(status);
}

function decodeErrorBody(body: unknown, status: number | undefined): GenerateMessageError {
	const inner = isRecord(body) ? body.error : undefined;
	if (!isRecord(body) || !isRecord(inner) || typeof inner.type !== 'string' || typeof inner.message !== 'string') {
		const message = typeof body === 'string' ? body : (JSON.stringify(body) ?? '');
		const error: GenerateMessageError = { kind: errorKindFromStatus(status), message };
		if (status !== undefined) error.status = status;
		return withHint(error, API, 'raw', body);
	}
	const error: GenerateMessageError = {
		kind: errorKind(inner.type, inner.message, status),
		message: inner.message,
		code: inner.type,
	};
	if (status !== undefined) error.status = status;
	withHint(error, API, 'code', true);
	withExt(error, body, ['type', 'error']);
	const innerExtras = pickExtensions(API, inner, ['type', 'message'])?.[API];
	if (innerExtras) mergeExtensions(error, { [API]: { error: innerExtras } });
	return error;
}

function encodeErrorBody(error: GenerateMessageError, ctx: Ctx): Wire {
	let type = ERROR_TYPES[error.kind] ?? 'api_error';
	if (error.code !== undefined) {
		if (hint(error, 'code') || error.code in ERROR_STATUS) type = error.code;
		else ctx.report({ code: 'drop', path: 'code', message: `error code ${error.code} has no Anthropic slot` });
	}
	if (error.param !== undefined) {
		ctx.report({ code: 'drop', path: 'param', message: 'Anthropic errors have no param' });
	}
	const innerExtras = ext(error, 'error');
	const inner: Wire = { ...(isRecord(innerExtras) ? innerExtras : {}), type, message: error.message };
	return applyExt(error, { type: 'error', error: inner }, ctx, '');
}

function encodeError(error: GenerateMessageError, ctx: Ctx): { status: number; body: unknown } {
	const raw = hint(error, 'raw');
	const fallbackStatus = (type: string) =>
		error.kind === 'timeout' ? 504 : (ERROR_STATUS[type] ?? statusFromErrorKind(error.kind));
	if (raw !== undefined) {
		return { status: error.status ?? statusFromErrorKind(error.kind), body: raw };
	}
	const body = encodeErrorBody(error, ctx);
	return { status: error.status ?? fallbackStatus((body.error as Wire).type as string), body };
}

// ---------------------------------------------------------------------------
// Stream

const DELTA_FIELDS: Record<string, [wire: string, common: 'text' | 'arguments' | 'signature']> = {
	text_delta: ['text', 'text'],
	thinking_delta: ['thinking', 'text'],
	input_json_delta: ['partial_json', 'arguments'],
	signature_delta: ['signature', 'signature'],
};

function appendDelta(part: GenerateMessagePart, field: 'text' | 'arguments' | 'signature', value: string): void {
	if (field === 'text' && (part.type === 'text' || part.type === 'reasoning')) part.text = (part.text ?? '') + value;
	else if (field === 'arguments' && part.type === 'tool-call') part.arguments += value;
	else if (field === 'signature' && part.type === 'reasoning') {
		part.signature = { api: API, value: (part.signature?.value ?? '') + value };
	}
}

/** Final part for `part-end`; the streamed `input` placeholder no longer describes the arguments. */
function finalizePart(part: GenerateMessagePart): GenerateMessagePart | undefined {
	if (part.type === 'native') return undefined;
	if (part.type !== 'tool-call' || !part.hints?.[API]) return part;
	const { input: _input, ...own } = part.hints[API];
	return { ...part, hints: { ...part.hints, [API]: own } };
}

function createStreamDecoder(ctx: Ctx) {
	const parts = new Map<number, GenerateMessagePart>();
	let usageSnapshot: Wire = {};
	const decodeStreamUsage = (usage: Wire): GenerateMessageUsage => {
		// Anthropic deltas contain cumulative counts for only the fields supplied.
		// Merge before normalization so cache reads/writes are included exactly once.
		usageSnapshot = { ...usageSnapshot, ...usage };
		// Same-protocol replay must retain the original event's sparse usage shape.
		return decodeUsage(ctx.source === ctx.target ? usage : usageSnapshot);
	};
	const partEnd = (index: number, extra?: Wire): GenerateMessageStreamEvent => {
		const event: StreamEvent<'part-end'> = { type: 'part-end', choice: 0, index };
		const part = parts.get(index);
		parts.delete(index);
		const final = part && finalizePart(part);
		if (final) event.part = final;
		return extra ? withExt(event, extra, ['type', 'index']) : event;
	};
	return {
		push(wire: AnthropicMessagesStreamEvent): GenerateMessageStreamEvent[] {
			const event = wire as Wire;
			switch (event.type) {
				case 'message_start': {
					const message = event.message;
					if (!isRecord(message)) break;
					const start: StreamEvent<'start'> = { type: 'start' };
					if (typeof message.id === 'string') start.id = message.id;
					if (typeof message.model === 'string') start.model = message.model;
					if (typeof message.type === 'string') withHint(start, API, 'type', message.type);
					if (Array.isArray(message.content) && message.content.length > 0) {
						withHint(start, API, 'content', message.content);
					}
					if (message.stop_reason != null) withHint(start, API, 'stopReason', message.stop_reason);
					withExt(start, message, RESPONSE_KEYS);
					const out: GenerateMessageStreamEvent[] = [start];
					if (isRecord(message.usage)) out.push({ type: 'usage', usage: decodeStreamUsage(message.usage) });
					return out;
				}
				case 'content_block_start': {
					if (typeof event.index !== 'number') break;
					const part = decodeBlock(event.content_block, true);
					parts.set(event.index, { ...part });
					const out: StreamEvent<'part-start'> = {
						type: 'part-start',
						choice: 0,
						index: event.index,
						role: 'assistant',
						part,
					};
					return [withExt(out, event, ['type', 'index', 'content_block'])];
				}
				case 'content_block_delta': {
					const delta = event.delta;
					const field = isRecord(delta) && typeof delta.type === 'string' ? DELTA_FIELDS[delta.type] : undefined;
					const plain =
						field &&
						typeof event.index === 'number' &&
						Object.keys(event).length === 3 &&
						isRecord(delta) &&
						Object.keys(delta).length === 2 &&
						typeof delta[field[0]] === 'string';
					// Citations and unknown deltas stay native so the same protocol can replay them.
					if (!plain || !field || !isRecord(delta) || typeof event.index !== 'number') break;
					const value = delta[field[0]] as string;
					const part = parts.get(event.index);
					if (part) appendDelta(part, field[1], value);
					return [{ type: 'part-delta', choice: 0, index: event.index, delta: { [field[1]]: value } }];
				}
				case 'content_block_stop':
					if (typeof event.index !== 'number') break;
					return [partEnd(event.index, event)];
				case 'message_delta': {
					const delta = isRecord(event.delta) ? event.delta : {};
					const finish: StreamEvent<'finish'> = { type: 'finish', choice: 0 };
					const finishReason = decodeStopReason(delta.stop_reason);
					if (finishReason) finish.finishReason = finishReason;
					withHint(finish, API, 'stopReason', delta.stop_reason);
					withExt(finish, delta, ['stop_reason']);
					const out: GenerateMessageStreamEvent[] = [finish];
					if (isRecord(event.usage)) out.push({ type: 'usage', usage: decodeStreamUsage(event.usage) });
					return out;
				}
				case 'error':
					if (!isRecord(event.error)) break;
					return [{ type: 'error', error: decodeErrorBody(event, undefined) }];
			}
			// ping, message_stop and unknown events: same-protocol encoders replay them, others ignore them.
			return [{ type: 'native', api: API, value: wire }];
		},
		end(): GenerateMessageStreamEvent[] {
			return [...parts.keys()].map((index) => partEnd(index));
		},
	};
}

interface EncoderBlock {
	index: number;
	kind: 'text' | 'thinking' | 'json' | 'other';
	/** The signature stream belongs to the Anthropic family. */
	signable: boolean;
	open: boolean;
	reported: Set<string>;
}

function blockKind(type: unknown): EncoderBlock['kind'] {
	if (type === 'text') return 'text';
	if (type === 'thinking') return 'thinking';
	if (typeof type === 'string' && type.endsWith('tool_use')) return 'json';
	return 'other';
}

function createStreamEncoder(ctx: Ctx) {
	const blocks = new Map<number, EncoderBlock>();
	const skipped = new Set<number>();
	const droppedChoices = new Set<number>();
	let nextIndex = 0;
	let start: StreamEvent<'start'> | undefined;
	let startUsage: GenerateMessageUsage | undefined;
	let deltaUsage: GenerateMessageUsage | undefined;
	let finish: StreamEvent<'finish'> | undefined;
	let started = false;
	let deltaSent = false;
	let stopSent = false;
	let errored = false;

	const acceptChoice = (choice: number): boolean => {
		if (choice === 0) return true;
		if (!droppedChoices.has(choice)) {
			droppedChoices.add(choice);
			ctx.report({ code: 'drop', path: `choices[${choice}]`, message: 'Anthropic streams a single message' });
		}
		return false;
	};

	const ensureStart = (out: Wire[]) => {
		if (started) return;
		started = true;
		const message = applyExt<Wire>(
			start,
			{
				id: start?.id ?? ctx.generateId('msg'),
				type: ctx.source === API && ctx.target === API ? (hint<string>(start, 'type') ?? 'message') : 'message',
				role: 'assistant',
				content: hint(start, 'content') ?? [],
				model: start?.model ?? ctx.request?.model ?? ctx.model ?? '',
				stop_reason: hint(start, 'stopReason') ?? null,
				usage: encodeUsage(startUsage, ctx, 'usage', true),
			},
			ctx,
			'start',
		);
		if (!('stop_sequence' in message)) message.stop_sequence = null;
		out.push({ type: 'message_start', message });
	};

	const closeBlocks = (out: Wire[]) => {
		for (const block of blocks.values()) {
			if (!block.open) continue;
			block.open = false;
			out.push({ type: 'content_block_stop', index: block.index });
		}
	};

	const sendDelta = (out: Wire[]) => {
		if (deltaSent) return;
		ensureStart(out);
		closeBlocks(out);
		deltaSent = true;
		const delta = applyExt<Wire>(
			finish,
			{
				stop_reason: encodeStopReason(
					finish?.finishReason,
					hint(finish, 'stopReason'),
					ext(finish, 'stop_sequence'),
					ctx,
					'finishReason',
				),
			},
			ctx,
			'finish',
		);
		if (!('stop_sequence' in delta)) delta.stop_sequence = null;
		// output_tokens is read unconditionally by Anthropic clients; 0 is a placeholder when no usage arrived.
		const usage = deltaUsage ? encodeUsage(deltaUsage, ctx, 'usage', false) : { output_tokens: 0 };
		out.push({ type: 'message_delta', delta, usage });
	};

	const reportOnce = (block: EncoderBlock, key: string, path: string, message: string) => {
		if (block.reported.has(key)) return;
		block.reported.add(key);
		ctx.report({ code: 'drop', path, message });
	};

	const openBlock = (event: StreamEvent<'part-start'>, out: Wire[]) => {
		const { part, index } = event;
		const path = `choices[0].message.content[${index}]`;
		let contentBlock: Wire | undefined;
		let initialArguments = '';
		if (part.type === 'tool-call') {
			const hinted = hint(part, 'input');
			contentBlock = { type: 'tool_use', id: part.id || ctx.generateId('toolu'), name: part.name, input: {} };
			if (hinted !== undefined && (part.arguments === '' || JSON.stringify(hinted) === part.arguments)) {
				contentBlock.input = hinted;
			} else {
				initialArguments = part.arguments;
			}
			if (part.signature) dropSignature(ctx, path, part.signature);
			contentBlock = applyExt(part, contentBlock, ctx, path);
		} else {
			contentBlock = encodePart(part, path, ctx, 'response');
		}
		if (!contentBlock) {
			skipped.add(index);
			return;
		}
		const signature = part.type === 'reasoning' ? part.signature : undefined;
		const block: EncoderBlock = {
			index: nextIndex++,
			kind: blockKind(contentBlock.type),
			signable: signature ? isFamily(signature.api) : hasOwnHints(part),
			open: true,
			reported: new Set(signature && !isFamily(signature.api) ? ['signature'] : []),
		};
		blocks.set(index, block);
		out.push(
			applyExt(event, { type: 'content_block_start', index: block.index, content_block: contentBlock }, ctx, path),
		);
		if (initialArguments) {
			out.push({
				type: 'content_block_delta',
				index: block.index,
				delta: { type: 'input_json_delta', partial_json: initialArguments },
			});
		}
	};

	const writeDelta = (event: StreamEvent<'part-delta'>, out: Wire[]) => {
		let block = blocks.get(event.index);
		const path = `choices[0].message.content[${event.index}]`;
		if (!block) {
			if (event.delta.text === undefined) {
				ctx.report({ code: 'drop', path, message: 'delta without part-start has no Anthropic block' });
				skipped.add(event.index);
				return;
			}
			openBlock({ type: 'part-start', choice: 0, index: event.index, part: { type: 'text', text: '' } }, out);
			block = blocks.get(event.index);
			if (!block) return;
		}
		const emit = (delta: Wire) => out.push({ type: 'content_block_delta', index: block.index, delta });
		const { text, summary, arguments: args, signature } = event.delta;
		for (const [key, value] of [
			['text', text],
			['summary', summary],
		] as const) {
			if (value === undefined) continue;
			if (block.kind === 'thinking') emit({ type: 'thinking_delta', thinking: value });
			else if (block.kind === 'text' && key === 'text') emit({ type: 'text_delta', text: value });
			else reportOnce(block, key, `${path}.${key}`, `${key} delta has no slot in this Anthropic block`);
		}
		if (args !== undefined) {
			if (block.kind === 'json') emit({ type: 'input_json_delta', partial_json: args });
			else reportOnce(block, 'arguments', `${path}.arguments`, 'arguments delta has no slot in this Anthropic block');
		}
		if (signature !== undefined) {
			if (block.kind === 'thinking' && block.signable) emit({ type: 'signature_delta', signature });
			else reportOnce(block, 'signature', `${path}.signature`, 'signature is not an Anthropic signature');
		}
	};

	const writeNative = (value: unknown, out: Wire[]) => {
		if (!isRecord(value)) return;
		switch (value.type) {
			case 'message_stop':
				if (stopSent) return;
				sendDelta(out);
				out.push(value);
				stopSent = true;
				return;
			case 'ping':
				if (start) ensureStart(out);
				out.push(value);
				return;
		}
		if (typeof value.index === 'number') {
			if (skipped.has(value.index)) return;
			ensureStart(out);
			const block = blocks.get(value.index);
			out.push(block ? { ...value, index: block.index } : value);
			return;
		}
		if (start) ensureStart(out);
		out.push(value);
	};

	return {
		push(event: GenerateMessageStreamEvent): AnthropicMessagesStreamEvent[] {
			const out: Wire[] = [];
			if (stopSent || errored) return [];
			switch (event.type) {
				case 'start':
					if (!started) start = event;
					break;
				case 'usage':
					if (started) deltaUsage = mergeUsage(deltaUsage, event.usage);
					else startUsage = mergeUsage(startUsage, event.usage);
					break;
				case 'part-start':
					if (!acceptChoice(event.choice) || blocks.has(event.index) || skipped.has(event.index)) break;
					ensureStart(out);
					// Anthropic streams one content block at a time.
					closeBlocks(out);
					openBlock(event, out);
					break;
				case 'part-delta':
					if (!acceptChoice(event.choice) || skipped.has(event.index)) break;
					ensureStart(out);
					writeDelta(event, out);
					break;
				case 'part-end': {
					if (!acceptChoice(event.choice)) break;
					const block = blocks.get(event.index);
					if (!block?.open) break;
					block.open = false;
					out.push(applyExt(event, { type: 'content_block_stop', index: block.index }, ctx, 'part-end'));
					break;
				}
				case 'finish':
					if (!acceptChoice(event.choice)) break;
					ensureStart(out);
					closeBlocks(out);
					finish = event;
					break;
				case 'error':
					// A received start is still owed to the client before the error; without one the error stands alone.
					if (start) ensureStart(out);
					errored = true;
					out.push(encodeErrorBody(event.error, ctx));
					break;
				case 'native':
					// Other protocols' native events (pings, lifecycle markers) have no Anthropic meaning.
					if (isFamily(event.api)) writeNative(event.value, out);
					break;
			}
			return out as AnthropicMessagesStreamEvent[];
		},
		end(): AnthropicMessagesStreamEvent[] {
			if (stopSent || errored) return [];
			if (!started && !start && !finish) return [];
			const out: Wire[] = [];
			sendDelta(out);
			out.push({ type: 'message_stop' });
			stopSent = true;
			return out as AnthropicMessagesStreamEvent[];
		},
	};
}

function mergeUsage(current: GenerateMessageUsage | undefined, next: GenerateMessageUsage): GenerateMessageUsage {
	if (!current) return next;
	const merged: GenerateMessageUsage = { ...current };
	for (const [key, value] of Object.entries(next)) {
		if (value === undefined || key === 'extensions' || key === 'hints') continue;
		(merged as Wire)[key] = value;
	}
	mergeExtensions(merged, next.extensions);
	for (const [api, fields] of Object.entries(next.hints ?? {})) {
		merged.hints = { ...merged.hints, [api]: { ...merged.hints?.[api as ApiType], ...fields } };
	}
	return merged;
}

export const AnthropicMessagesCodec: GenerateMessageCodec<
	AnthropicMessagesRequest,
	AnthropicMessagesResponse,
	AnthropicMessagesStreamEvent
> = {
	api: API,
	decodeRequest: (wire) => decodeRequest(wire),
	encodeRequest,
	decodeResponse: (wire) => decodeResponse(wire),
	encodeResponse,
	createStreamDecoder,
	createStreamEncoder,
	decodeError: ({ status, body }) => decodeErrorBody(body, status),
	encodeError,
};
