import type { OpenAIResponsesRequest, OpenAIResponsesResponse } from '../../../../openai-responses/schema';
import { ApiType } from '../../../../schema/ApiType';
import type { GenerateMessageAdapterContext } from '../../context';
import type {
	GenerateMessage,
	GenerateMessageError,
	GenerateMessageErrorKind,
	GenerateMessageFinishReason,
	GenerateMessageNode,
	GenerateMessagePart,
	GenerateMessageRequest,
	GenerateMessageResponse,
	GenerateMessageTool,
	GenerateMessageUsage,
} from '../../types';
import {
	applyExtensions,
	errorKindFromStatus,
	getHint,
	isRecord,
	pickExtensions,
	statusFromErrorKind,
	withHint,
} from '../../utils';

export const API = ApiType.OpenAIResponses;
export type Wire = Record<string, unknown>;
export type Ctx = GenerateMessageAdapterContext;
type Fields = Record<string, string>;
export const hint = <T = unknown>(node: GenerateMessageNode | undefined, key: string) => getHint<T>(node, API, key);
const mark = <const T extends object>(node: T, key: string, value: unknown): T & GenerateMessageNode =>
	withHint(node as T & GenerateMessageNode, API, key, value);
export const record = (value: unknown): Wire => (isRecord(value) ? value : {});
function extension(node: GenerateMessageNode, key: string, value: unknown): void {
	if (value !== undefined) node.extensions = { ...node.extensions, [API]: { ...node.extensions?.[API], [key]: value } };
}
function nested(node: GenerateMessageNode, key: string): GenerateMessageNode {
	return { extensions: { [API]: record(node.extensions?.[API]?.[key]) } };
}
function without(node: GenerateMessageNode, keys: string[]): GenerateMessageNode {
	const own = { ...node.extensions?.[API] };
	for (const key of keys) delete own[key];
	return { ...node, extensions: { ...node.extensions, [API]: own } };
}
export function drop(ctx: Ctx, path: string, message: string, api: ApiType = API): void {
	ctx.report({ code: 'drop', path, message, api });
}

/** Nulls are shape hints; unknown fields remain protocol extensions. */
function readFields<const T extends object>(
	value: T,
	wire: Wire,
	fields: Fields,
	known: string[] = [],
): T & GenerateMessageNode {
	const node = value as T & GenerateMessageNode;
	const nulls: string[] = [];
	for (const [key, target] of Object.entries(fields)) {
		if (wire[key] === null) nulls.push(key);
		else if (wire[key] !== undefined) (node as Wire)[target] = wire[key];
	}
	if (nulls.length) mark(node, 'nulls', nulls);
	node.extensions = pickExtensions(API, wire, [...Object.keys(fields), ...known]);
	return node;
}
function writeFields(node: GenerateMessageNode, fields: Fields, ctx: Ctx, path: string, wire: Wire = {}): Wire {
	for (const [key, source] of Object.entries(fields)) {
		const value = (node as Wire)[source];
		if (value !== undefined) wire[key] = value;
	}
	for (const key of hint<string[]>(node, 'nulls') ?? []) if (!(key in wire)) wire[key] = null;
	return applyExtensions(API, node, wire, ctx, path);
}
function native(value: unknown, level: 'item' | 'block' = 'block'): GenerateMessagePart {
	return mark({ type: 'native', api: API, value }, 'level', level);
}
function signature(part: GenerateMessagePart, ctx: Ctx, path: string): void {
	if ('signature' in part && part.signature) {
		drop(ctx, `${path}.signature`, 'Signature has no Responses content slot', part.signature.api);
	}
}
export function decodeBlock(value: unknown): GenerateMessagePart {
	if (!isRecord(value)) return native(value);
	const b = value;
	let part: GenerateMessagePart;
	switch (b.type) {
		case 'input_text':
		case 'output_text':
		case 'text':
			if (typeof b.text !== 'string') return native(b);
			part = readFields({ type: 'text', text: b.text }, b, {}, ['type', 'text']);
			break;
		case 'input_image':
		case 'image':
			part = readFields({ type: 'image' }, b, { image_url: 'url', file_id: 'fileId', detail: 'detail' }, ['type']);
			break;
		case 'input_file':
			part = readFields(
				{ type: 'file' },
				b,
				{ file_id: 'fileId', file_data: 'data', filename: 'filename', file_url: 'url' },
				['type'],
			);
			break;
		case 'input_audio': {
			if (
				!isRecord(b.input_audio) ||
				typeof b.input_audio.data !== 'string' ||
				typeof b.input_audio.format !== 'string'
			)
				return native(b);
			part = readFields({ type: 'audio' }, b.input_audio, { data: 'data', format: 'format' });
			const inner = part.extensions?.[API];
			part.extensions = pickExtensions(API, b, ['type', 'input_audio']);
			extension(part, 'input_audio', inner);
			break;
		}
		case 'refusal':
			if (typeof b.refusal !== 'string') return native(b);
			part = readFields({ type: 'refusal', text: b.refusal }, b, {}, ['type', 'refusal']);
			break;
		default:
			return native(b);
	}
	return mark(part, 'blockType', b.type);
}
export function encodeBlock(part: GenerateMessagePart, role: string, ctx: Ctx, path: string): Wire | undefined {
	let wire: Wire;
	signature(part, ctx, path);
	switch (part.type) {
		case 'text':
			wire = {
				type: hint(part, 'blockType') ?? (role === 'assistant' ? 'output_text' : 'input_text'),
				text: part.text,
			};
			break;
		case 'refusal':
			wire = { type: 'refusal', refusal: part.text };
			break;
		case 'image': {
			wire = writeFields(part, { image_url: 'url', file_id: 'fileId', detail: 'detail' }, ctx, path, {
				type: hint(part, 'blockType') ?? 'input_image',
			});
			if (part.data !== undefined) {
				if (part.mediaType) wire.image_url = `data:${part.mediaType};base64,${part.data}`;
				else drop(ctx, `${path}.data`, 'Inline image requires mediaType');
			}
			if (wire.image_url === undefined && wire.file_id === undefined && wire.detail === undefined) {
				drop(ctx, path, 'Image requires a URL or file identifier');
				return;
			}
			return wire;
		}
		case 'file':
			wire = writeFields(
				part,
				{ file_id: 'fileId', file_data: 'data', filename: 'filename', file_url: 'url' },
				ctx,
				path,
				{ type: 'input_file' },
			);
			if (part.mediaType !== undefined) drop(ctx, `${path}.mediaType`, 'File mediaType has no wire field');
			return wire;
		case 'audio':
			if (ctx.source !== API || ctx.target !== API) {
				drop(ctx, path, 'Audio has no Responses content mapping');
				return;
			}
			if (part.url !== undefined) drop(ctx, `${path}.url`, 'Audio URL has no input_audio mapping');
			if (part.data === undefined || part.format === undefined) {
				drop(ctx, path, 'Audio requires data and format');
				return;
			}
			wire = {
				type: 'input_audio',
				input_audio: applyExtensions(
					API,
					nested(part, 'input_audio'),
					{ data: part.data, format: part.format },
					ctx,
					`${path}.input_audio`,
				),
			};
			break;
		case 'native':
			applyExtensions(API, part, {}, ctx, path);
			if (part.api === API && isRecord(part.value)) {
				if (role === 'assistant' && typeof part.value.text === 'string' && part.value.type !== 'output_text') {
					ctx.report({
						code: 'lossy',
						path,
						api: API,
						message: 'Unsupported assistant content part normalized to output_text',
					});
					return { type: 'output_text', text: part.value.text };
				}
				return structuredClone(part.value);
			}
			drop(ctx, path, 'Native part belongs to another protocol', part.api);
			return;
		default:
			drop(ctx, path, `${part.type} cannot be nested in message content`);
			return;
	}
	return writeFields(part, {}, ctx, path, wire);
}

type ItemMeta = {
	item: number;
	kind: string;
	node?: GenerateMessageNode;
	string?: boolean;
	role?: string;
	empty?: boolean;
};

function decodeReasoning(wire: Wire): GenerateMessagePart {
	const part: GenerateMessagePart = { type: 'reasoning' };
	const known = ['type'];
	if (typeof wire.encrypted_content === 'string') {
		part.signature = { api: API, value: wire.encrypted_content };
		known.push('encrypted_content');
	}
	for (const [key, blockType] of [
		['summary', 'summary_text'],
		['content', 'reasoning_text'],
	] as const) {
		if (!Array.isArray(wire[key])) continue;
		const entries = wire[key] as unknown[];
		const texts = entries
			.filter((v) => isRecord(v) && v.type === blockType && typeof v.text === 'string')
			.map((v) => (v as Wire).text as string);
		if (key === 'summary') part.summary = texts;
		else part.text = texts.join('');
		// Preserve block boundaries and unknown blocks while keeping mapped text editable.
		mark(
			part,
			key,
			entries.map((v) =>
				isRecord(v) && v.type === blockType && typeof v.text === 'string'
					? { mapped: true, length: v.text.length, node: { extensions: pickExtensions(API, v, ['type', 'text']) } }
					: { native: native(v) },
			),
		);
		known.push(key);
	}
	readFields(part, wire, {}, known);
	for (const key of ['summary', 'content']) {
		const layout = hint<Array<{ node?: GenerateMessageNode; native?: GenerateMessagePart }>>(part, key);
		if (layout?.some((entry) => entry.native || entry.node?.extensions)) {
			extension(
				part,
				key,
				layout.map((entry) =>
					entry.native ? { native: entry.native } : { fields: entry.node?.extensions?.[API] ?? {} },
				),
			);
		}
	}
	return part;
}
function encodeReasoning(part: Extract<GenerateMessagePart, { type: 'reasoning' }>, ctx: Ctx, path: string): Wire {
	const wire: Wire = { type: 'reasoning' };
	if (part.redacted !== undefined && !part.signature)
		drop(ctx, `${path}.redacted`, 'Redacted reasoning requires encrypted content');
	if (part.signature?.api === API) wire.encrypted_content = part.signature.value;
	else if (part.signature)
		drop(ctx, `${path}.signature`, 'Only Responses encrypted reasoning can be replayed', part.signature.api);
	for (const [key, blockType] of [
		['summary', 'summary_text'],
		['content', 'reasoning_text'],
	] as const) {
		const text = part.text;
		if (key === 'summary' ? part.summary === undefined : text === undefined) continue;
		const layout = hint<
			Array<{ mapped?: boolean; length?: number; node?: GenerateMessageNode; native?: GenerateMessagePart }>
		>(part, key);
		let cursor = 0;
		let index = 0;
		const values = part.summary ?? [];
		const result: Wire[] = [];
		const extras = part.extensions?.[API]?.[key];
		if (layout)
			for (let i = 0; i < layout.length; i++) {
				const entry = layout[i];
				const extra = Array.isArray(extras) ? record(extras[i]) : {};
				if (entry.native) {
					const b = encodeBlock(
						(extra.native as GenerateMessagePart | undefined) ?? entry.native,
						'assistant',
						ctx,
						`${path}.${key}[${i}]`,
					);
					if (b) result.push(b);
				} else {
					const last = !layout.slice(i + 1).some((v) => v.mapped);
					const chunk =
						key === 'summary'
							? values[index++]
							: (text ?? '').slice(cursor, last ? undefined : cursor + (entry.length ?? 0));
					cursor += entry.length ?? 0;
					if (chunk !== undefined)
						result.push(
							applyExtensions(
								API,
								{ extensions: { [API]: record(extra.fields) } },
								{ type: blockType, text: chunk },
								ctx,
								`${path}.${key}[${i}]`,
							),
						);
				}
			}
		if (key === 'summary') for (; index < values.length; index++) result.push({ type: blockType, text: values[index] });
		else if (!layout || !layout.some((v) => v.mapped)) {
			if (!layout || text) result.push({ type: blockType, text });
		}
		wire[key] = result;
	}
	return writeFields(part, {}, ctx, path, wire);
}

function decodeItem(wire: Wire, index: number): GenerateMessage {
	let role = 'assistant';
	let parts: GenerateMessagePart[];
	const meta: ItemMeta = { item: index, kind: String(wire.type ?? 'message') };
	if (
		(wire.type === 'message' || wire.type === undefined) &&
		typeof wire.role === 'string' &&
		(typeof wire.content === 'string' || Array.isArray(wire.content))
	) {
		role = wire.role;
		parts = typeof wire.content === 'string' ? [{ type: 'text', text: wire.content }] : wire.content.map(decodeBlock);
		meta.node = readFields({}, wire, {}, ['type', 'role', 'content']);
		mark(meta.node, 'omitType', wire.type === undefined);
		meta.string = typeof wire.content === 'string';
		meta.role = role;
		meta.empty = parts.length === 0;
	} else if (
		(wire.type === 'function_call' || wire.type === 'custom_tool_call') &&
		typeof wire.call_id === 'string' &&
		typeof wire.name === 'string' &&
		typeof wire[wire.type === 'function_call' ? 'arguments' : 'input'] === 'string'
	) {
		parts = [
			readFields(
				{
					type: 'tool-call',
					id: wire.call_id,
					name: wire.name,
					arguments: String(wire[wire.type === 'function_call' ? 'arguments' : 'input']),
					toolType: wire.type === 'custom_tool_call' ? 'custom' : 'function',
				},
				wire,
				{},
				['type', 'call_id', 'name', wire.type === 'function_call' ? 'arguments' : 'input'],
			),
		];
	} else if (
		(wire.type === 'function_call_output' || wire.type === 'custom_tool_call_output') &&
		(typeof wire.output === 'string' || Array.isArray(wire.output))
	) {
		role = 'tool';
		const part: GenerateMessagePart = readFields(
			{
				type: 'tool-result',
				toolCallId: typeof wire.call_id === 'string' ? wire.call_id : '',
				content: typeof wire.output === 'string' ? wire.output : wire.output.map(decodeBlock),
			},
			wire,
			{},
			['type', 'call_id', 'output'],
		);
		mark(part, 'omitCallId', wire.call_id === undefined);
		mark(part, 'outputType', wire.type);
		parts = [part];
	} else if (wire.type === 'reasoning') parts = [decodeReasoning(wire)];
	else parts = [native(wire, 'item')];
	for (const part of parts) mark(part, 'item', index);
	return mark({ role, content: parts }, 'items', [meta]);
}
function exposeItems(message: GenerateMessage): void {
	const entries = (hint<ItemMeta[]>(message, 'items') ?? []).flatMap((meta) =>
		meta.node?.extensions?.[API] ? [[String(meta.item), meta.node.extensions[API]]] : [],
	);
	if (entries.length) extension(message, 'items', Object.fromEntries(entries));
}
export function decodeItems(items: unknown[]): GenerateMessage[] {
	const messages: GenerateMessage[] = [];
	for (const [index, item] of items.entries()) {
		const message = decodeItem(record(item), index);
		const last = messages.at(-1);
		const kind = String(record(item).type ?? 'message');
		const mergeable = [
			'message',
			'reasoning',
			'function_call',
			'custom_tool_call',
			'function_call_output',
			'custom_tool_call_output',
		].includes(kind);
		if (
			mergeable &&
			last?.role === message.role &&
			(message.role === 'assistant' || message.role === 'tool') &&
			!hint(last, 'noMerge')
		) {
			last.content.push(...message.content);
			mark(last, 'items', [...(hint<ItemMeta[]>(last, 'items') ?? []), ...(hint<ItemMeta[]>(message, 'items') ?? [])]);
		} else {
			if (!mergeable) mark(message, 'noMerge', true);
			messages.push(message);
		}
	}
	for (const message of messages) exposeItems(message);
	return messages;
}

export function encodeItemPart(part: GenerateMessagePart, ctx: Ctx, path: string): Wire | undefined {
	if (part.type === 'reasoning') return encodeReasoning(part, ctx, path);
	if (part.type === 'tool-call') {
		signature(part, ctx, path);
		if (part.toolType && !['function', 'custom'].includes(part.toolType)) {
			drop(ctx, `${path}.toolType`, 'Unsupported tool call type');
			return;
		}
		return writeFields(part, {}, ctx, path, {
			type: part.toolType === 'custom' ? 'custom_tool_call' : 'function_call',
			call_id: part.id,
			name: part.name,
			[part.toolType === 'custom' ? 'input' : 'arguments']: part.arguments,
		});
	}
	if (part.type === 'tool-result') {
		if (part.name !== undefined) drop(ctx, `${path}.name`, 'Tool output is associated by call_id');
		if (part.isError !== undefined) drop(ctx, `${path}.isError`, 'Tool output has no error flag');
		const output =
			typeof part.content === 'string'
				? part.content
				: part.content.flatMap((p, i) => encodeBlock(p, 'user', ctx, `${path}.content[${i}]`) ?? []);
		const wire: Wire = { type: hint(part, 'outputType') ?? 'function_call_output', output };
		if (!hint(part, 'omitCallId') || part.toolCallId) wire.call_id = part.toolCallId;
		return writeFields(part, {}, ctx, path, wire);
	}
	if (part.type === 'native') return encodeBlock(part, 'assistant', ctx, path);
	return undefined;
}
export function itemPart(part: GenerateMessagePart): boolean {
	return (
		['reasoning', 'tool-call', 'tool-result'].includes(part.type) ||
		(part.type === 'native' && hint(part, 'level') === 'item')
	);
}
export function encodeItems(messages: GenerateMessage[], ctx: Ctx, path: string, response = false): Wire[] {
	const output: Wire[] = [];
	for (const [mi, message] of messages.entries()) {
		const mp = `${path}[${mi}]`;
		if (ctx.source !== API && !['user', 'assistant', 'system', 'developer', 'tool'].includes(message.role)) {
			drop(ctx, `${mp}.role`, `Responses cannot represent role ${message.role}`);
			continue;
		}
		const own = applyExtensions(API, without(message, ['items']), {}, ctx, mp);
		const itemFields = record(message.extensions?.[API]?.items);
		if (message.name !== undefined) drop(ctx, `${mp}.name`, 'Message names have no Responses field');
		const metas = hint<ItemMeta[]>(message, 'items') ?? [];
		const groups: Array<{ meta?: ItemMeta; parts: GenerateMessagePart[] }> = [];
		for (const part of message.content) {
			const id = hint<number>(part, 'item');
			const meta = id === undefined ? undefined : metas.find((m) => m.item === id);
			const last = groups.at(-1);
			if (last && last.meta === meta && !itemPart(part) && !last.parts.some(itemPart)) last.parts.push(part);
			else groups.push({ meta, parts: [part] });
		}
		for (const meta of metas.filter((m) => m.empty)) {
			const pos = groups.findIndex((g) => g.meta !== undefined && g.meta.item > meta.item);
			groups.splice(pos < 0 ? groups.length : pos, 0, { meta, parts: [] });
		}
		if (!groups.length && response) continue;
		if (!groups.length) groups.push({ parts: [] });
		for (const [gi, { meta, parts }] of groups.entries()) {
			if (parts.length && itemPart(parts[0])) {
				const item = encodeItemPart(parts[0], ctx, `${mp}.content[${message.content.indexOf(parts[0])}]`);
				if (item) output.push(item);
				continue;
			}
			const content = parts.flatMap(
				(part) => encodeBlock(part, message.role, ctx, `${mp}.content[${message.content.indexOf(part)}]`) ?? [],
			);
			if (!content.length && ctx.source !== API) {
				ctx.report({
					code: 'lossy',
					path: `${mp}.content`,
					api: API,
					message: 'Empty Responses message content replaced with empty input_text',
				});
				content.push({ type: 'input_text', text: '' });
			}
			if (parts.length && !content.length) continue;
			const wire: Wire = { ...own, role: response ? (meta?.role ?? message.role) : message.role, content };
			if (!hint(meta?.node, 'omitType') || response) wire.type = 'message';
			if (meta?.string && parts.length === 1 && parts[0].type === 'text') wire.content = parts[0].text;
			const node = meta ? { ...meta.node, extensions: { [API]: record(itemFields[String(meta.item)]) } } : undefined;
			output.push(applyExtensions(API, node, wire, ctx, `${mp}.items[${gi}]`));
		}
	}
	return output;
}

const requestFields = {
	model: 'model',
	parallel_tool_calls: 'parallelToolCalls',
	stream: 'stream',
	max_output_tokens: 'maxOutputTokens',
	temperature: 'temperature',
	top_p: 'topP',
	metadata: 'metadata',
	user: 'user',
};
function decodeTool(w: Wire): GenerateMessageTool {
	if ((w.type !== 'function' && w.type !== 'custom') || typeof w.name !== 'string')
		return { type: 'native', api: API, value: w };
	return readFields(
		{ type: w.type, name: w.name },
		w,
		{
			description: 'description',
			[w.type === 'custom' ? 'format' : 'parameters']: 'parameters',
			...(w.type === 'function' ? { strict: 'strict' } : {}),
		},
		['type', 'name'],
	);
}
function encodeTool(tool: GenerateMessageTool, ctx: Ctx, path: string): Wire | undefined {
	if (tool.type === 'native') {
		applyExtensions(API, tool, {}, ctx, path);
		if (tool.api === API && isRecord(tool.value)) return structuredClone(tool.value);
		drop(ctx, path, 'Native tool belongs to another protocol', tool.api);
		return;
	}
	if (tool.type === 'custom' && tool.strict !== undefined)
		drop(ctx, `${path}.strict`, 'Custom tools have no strict field');
	const wire = writeFields(
		tool,
		{
			description: 'description',
			[tool.type === 'custom' ? 'format' : 'parameters']: 'parameters',
			...(tool.type === 'function' ? { strict: 'strict' } : {}),
		},
		ctx,
		path,
		{ type: tool.type, name: tool.name },
	);
	if (wire && 'parameters' in wire && wire.parameters !== null && !isRecord(wire.parameters)) {
		delete wire.parameters;
		ctx.report({
			code: 'lossy',
			path: `${path}.parameters`,
			api: API,
			message: 'Non-object parameters dropped for Responses',
		});
	}
	return wire;
}
export function decodeRequest(w: OpenAIResponsesRequest): GenerateMessageRequest {
	const request: GenerateMessageRequest = {
		messages:
			typeof w.input === 'string'
				? [{ role: 'user', content: [{ type: 'text', text: w.input }] }]
				: Array.isArray(w.input)
					? decodeItems(w.input)
					: [],
	};
	readFields(request, w, requestFields, ['input', 'instructions', 'tools', 'tool_choice', 'reasoning', 'text']);
	const inputShape =
		w.input === null ? 'null' : w.input === undefined ? 'absent' : typeof w.input === 'string' ? 'string' : 'array';
	mark(request, 'inputShape', inputShape);
	if (typeof w.instructions === 'string') request.system = [{ type: 'text', text: w.instructions }];
	else if (w.instructions === null) mark(request, 'instructionsNull', true);
	if (w.tools) request.tools = w.tools.map(decodeTool);
	if (typeof w.tool_choice === 'string') {
		if (w.tool_choice === 'none' || w.tool_choice === 'auto' || w.tool_choice === 'required') {
			request.toolChoice = w.tool_choice;
		} else {
			request.toolChoice = { type: 'native', api: API, value: w.tool_choice };
		}
	} else if (w.tool_choice) {
		if (
			(w.tool_choice.type === 'function' || w.tool_choice.type === 'custom') &&
			typeof w.tool_choice.name === 'string'
		) {
			request.toolChoice = { type: 'tool', name: w.tool_choice.name };
			mark(request, 'toolChoice', { type: w.tool_choice.type });
			extension(request, 'tool_choice', pickExtensions(API, w.tool_choice, ['type', 'name'])?.[API]);
		} else request.toolChoice = { type: 'native', api: API, value: w.tool_choice };
	}
	if (isRecord(w.reasoning)) request.reasoning = readFields({}, w.reasoning, { effort: 'effort', summary: 'summary' });
	else if (w.reasoning === null) mark(request, 'reasoningNull', true);
	if (isRecord(w.text)) {
		const f = w.text.format;
		const mapped = isRecord(f) && ['text', 'json_schema', 'json_object'].includes(String(f.type));
		if (mapped)
			request.responseFormat = readFields(
				{ type: f.type as 'text' | 'json_schema' | 'json_object' },
				f,
				{ name: 'name', description: 'description', schema: 'schema', strict: 'strict' },
				['type'],
			);
		const text = pickExtensions(API, w.text, mapped ? ['format'] : [])?.[API] ?? {};
		request.extensions = { ...request.extensions, [API]: { ...request.extensions?.[API], text } };
	} else if (w.text === null) mark(request, 'textNull', true);
	return request;
}
export function encodeRequest(request: GenerateMessageRequest, ctx: Ctx): OpenAIResponsesRequest {
	const wire = writeFields(request, requestFields, ctx, 'request');
	if (typeof wire.temperature === 'number') wire.temperature = clampRange(wire.temperature, 0, 2, 'temperature', ctx);
	if (typeof wire.top_p === 'number') wire.top_p = clampRange(wire.top_p, 0, 1, 'topP', ctx);
	if (typeof wire.max_output_tokens === 'number' && wire.max_output_tokens < 16) {
		ctx.report({
			code: 'lossy',
			path: 'maxOutputTokens',
			api: API,
			message: 'Responses requires max_output_tokens >= 16; clamped to 16',
		});
		wire.max_output_tokens = 16;
	}
	let input: unknown = encodeItems(request.messages, ctx, 'messages');
	const shape = hint(request, 'inputShape');
	if (
		shape === 'string' &&
		request.messages.length === 1 &&
		request.messages[0].role === 'user' &&
		request.messages[0].content.length === 1 &&
		request.messages[0].content[0].type === 'text'
	)
		input = request.messages[0].content[0].text;
	if (request.messages.length || (shape !== 'absent' && shape !== 'null')) wire.input = input;
	else if (shape === 'null') wire.input = null;
	if (request.system !== undefined) {
		const text: string[] = [];
		for (const [i, part] of request.system.entries()) {
			if (part.type === 'text') {
				text.push(part.text);
				signature(part, ctx, `system[${i}]`);
				const extras = applyExtensions(API, part, {}, ctx, `system[${i}]`);
				for (const k of Object.keys(extras)) drop(ctx, `system[${i}].${k}`, 'Instructions have no per-part fields');
			} else drop(ctx, `system[${i}]`, 'Instructions only support text');
		}
		wire.instructions = text.join('\n\n');
		if (text.length > 1)
			ctx.report({
				code: 'lossy',
				path: 'system',
				api: API,
				message: 'Instruction text parts were joined with blank lines',
			});
	} else if (hint(request, 'instructionsNull')) wire.instructions = null;
	if (request.tools) wire.tools = request.tools.flatMap((tool, i) => encodeTool(tool, ctx, `tools[${i}]`) ?? []);
	const choice = request.toolChoice;
	if (typeof choice === 'string') wire.tool_choice = choice;
	else if (choice?.type === 'tool') {
		const original = hint<GenerateMessageNode & { type: string }>(request, 'toolChoice');
		wire.tool_choice = applyExtensions(
			API,
			nested(request, 'tool_choice'),
			{
				type:
					original?.type ??
					(request.tools?.some((t) => t.type === 'custom' && t.name === choice.name) ? 'custom' : 'function'),
				name: choice.name,
			},
			ctx,
			'toolChoice',
		);
	} else if (choice?.type === 'native') {
		if (choice.api === API) wire.tool_choice = choice.value;
		else drop(ctx, 'toolChoice', 'Native tool choice belongs to another protocol', choice.api);
	}
	if (request.reasoning) {
		wire.reasoning = writeFields(request.reasoning, { effort: 'effort', summary: 'summary' }, ctx, 'reasoning');
		for (const key of ['budgetTokens', 'enabled'] as const)
			if (request.reasoning[key] !== undefined)
				drop(ctx, `reasoning.${key}`, 'Reasoning setting has no Responses mapping');
	} else if (hint(request, 'reasoningNull')) wire.reasoning = null;
	if (isRecord(wire.reasoning) && typeof wire.reasoning.effort === 'string') {
		const efforts = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
		if (!efforts.includes(wire.reasoning.effort)) {
			delete wire.reasoning.effort;
			ctx.report({
				code: 'lossy',
				path: 'reasoning.effort',
				api: API,
				message: 'Unsupported Responses reasoning effort dropped',
			});
		}
	}
	if (request.responseFormat)
		wire.text = {
			...record(wire.text),
			format: writeFields(
				request.responseFormat,
				{ name: 'name', description: 'description', schema: 'schema', strict: 'strict' },
				ctx,
				'responseFormat',
				{ type: request.responseFormat.type },
			),
		};
	else if (hint(request, 'textNull')) wire.text = null;
	for (const key of ['topK', 'stop', 'seed', 'presencePenalty', 'frequencyPenalty', 'n'] as const)
		if (request[key] !== undefined) drop(ctx, key, 'Request setting has no Responses mapping');
	return wire as OpenAIResponsesRequest;
}

function clampRange(value: number, min: number, max: number, path: string, ctx: Ctx): number {
	const clamped = Math.min(max, Math.max(min, value));
	if (clamped !== value)
		ctx.report({
			code: 'lossy',
			path,
			api: API,
			message: `${path} is outside the Responses range; clamped to ${clamped}`,
		});
	return clamped;
}

const usageFields = { input_tokens: 'inputTokens', output_tokens: 'outputTokens', total_tokens: 'totalTokens' };
export function decodeUsage(wire: Wire): GenerateMessageUsage {
	const usage = readFields({}, wire, usageFields, [
		'input_tokens_details',
		'output_tokens_details',
	]) as GenerateMessageUsage;
	for (const [key, field, token] of [
		['input_tokens_details', 'cachedInputTokens', 'cached_tokens'],
		['output_tokens_details', 'reasoningTokens', 'reasoning_tokens'],
	] as const) {
		if (isRecord(wire[key])) {
			usage[field] = wire[key][token] as number;
			extension(usage, key, pickExtensions(API, wire[key], [token])?.[API]);
		}
	}
	return usage;
}
export function encodeUsage(usage: GenerateMessageUsage, ctx: Ctx): Wire {
	const wire = writeFields(usage, usageFields, ctx, 'usage');
	const inputPresent = usage.inputTokens !== undefined;
	const outputPresent = usage.outputTokens !== undefined;
	if (!inputPresent) {
		wire.input_tokens = 0;
		ctx.report({
			code: 'lossy',
			path: 'usage.inputTokens',
			api: API,
			message: 'Missing input token count encoded as 0',
		});
	}
	if (!outputPresent) {
		wire.output_tokens = 0;
		ctx.report({
			code: 'lossy',
			path: 'usage.outputTokens',
			api: API,
			message: 'Missing output token count encoded as 0',
		});
	}
	if (usage.totalTokens === undefined) {
		wire.total_tokens = inputPresent && outputPresent ? usage.inputTokens! + usage.outputTokens! : 0;
		ctx.report({
			code: 'lossy',
			path: 'usage.totalTokens',
			api: API,
			message:
				inputPresent && outputPresent
					? 'Total token count derived from input and output'
					: 'Missing total token count encoded as 0',
		});
	}
	for (const [key, field, token] of [
		['input_tokens_details', 'cachedInputTokens', 'cached_tokens'],
		['output_tokens_details', 'reasoningTokens', 'reasoning_tokens'],
	] as const) {
		if (usage[field] !== undefined)
			wire[key] = applyExtensions(API, nested(usage, key), { [token]: usage[field] }, ctx, `usage.${key}`);
	}
	if (usage.cacheWriteInputTokens !== undefined)
		drop(ctx, 'usage.cacheWriteInputTokens', 'Responses has no cache creation count');
	return wire;
}
export function finishReason(wire: Wire): GenerateMessageFinishReason | undefined {
	if (wire.status === 'completed')
		return Array.isArray(wire.output) &&
			wire.output.some((v) => ['function_call', 'custom_tool_call'].includes(String(record(v).type)))
			? 'tool-calls'
			: 'stop';
	if (wire.status === 'failed') return 'error';
	if (wire.status === 'incomplete') {
		const reason = record(wire.incomplete_details).reason;
		return reason === 'max_output_tokens' ? 'length' : reason === 'content_filter' ? 'content-filter' : 'other';
	}
	return undefined;
}
export function decodeResponse(wire: OpenAIResponsesResponse): GenerateMessageResponse {
	const messages = decodeItems(wire.output);
	const message: GenerateMessage = { role: 'assistant', content: messages.flatMap((m) => m.content) };
	mark(
		message,
		'items',
		messages.flatMap((m) => hint<ItemMeta[]>(m, 'items') ?? []),
	);
	exposeItems(message);
	const response = readFields<GenerateMessageResponse>(
		{ choices: [{ index: 0, message, finishReason: finishReason(wire) }] },
		wire,
		{ id: 'id', model: 'model', created_at: 'created' },
		['object', 'output', 'usage', 'status'],
	);
	mark(response, 'object', wire.object);
	mark(response, 'status', { present: 'status' in wire, value: wire.status, finish: finishReason(wire) });
	if (wire.usage) response.usage = decodeUsage(wire.usage);
	else if (wire.usage === null) mark(response, 'usageNull', true);
	return response;
}
export function encodeResponse(response: GenerateMessageResponse, ctx: Ctx): OpenAIResponsesResponse {
	const choice = response.choices[0];
	for (let i = 1; i < response.choices.length; i++) drop(ctx, `choices[${i}]`, 'Responses supports one choice');
	const choiceExtras = applyExtensions(API, choice, {}, ctx, 'choices[0]');
	for (const key of Object.keys(choiceExtras)) drop(ctx, `choices[0].${key}`, 'Responses has no choice-level fields');
	const wire = writeFields(response, { id: 'id', model: 'model', created_at: 'created' }, ctx, 'response', {
		object: ctx.source === API && ctx.target === API ? (hint<string>(response, 'object') ?? 'response') : 'response',
	});
	wire.id ??= ctx.generateId('resp');
	wire.created_at ??= ctx.now();
	wire.model ??= ctx.request?.model ?? ctx.model;
	if (typeof wire.model !== 'string') {
		wire.model = '';
		ctx.report({
			code: 'lossy',
			path: 'model',
			api: API,
			message: 'Missing Responses model encoded as an empty string',
		});
	}
	wire.output = choice ? encodeItems([choice.message], ctx, 'choices[0].message', true) : [];
	if (ctx.source !== API || ctx.target !== API) {
		for (const [index, item] of (wire.output as Wire[]).entries()) {
			if (item.type === 'message' || item.type === 'function_call' || item.type === 'custom_tool_call') {
				if (item.id === undefined) {
					item.id = ctx.generateId(item.type === 'message' ? 'msg' : 'fc');
					ctx.report({
						code: 'default',
						path: `output[${index}].id`,
						message: 'Response output item requires an identifier',
					});
				}
			}
			if (item.type === 'message' && Array.isArray(item.content)) {
				for (const [partIndex, part] of (item.content as Wire[]).entries()) {
					if (part.type !== 'output_text' || part.annotations !== undefined) continue;
					part.annotations = [];
					ctx.report({
						code: 'default',
						path: `output[${index}].content[${partIndex}].annotations`,
						message: 'Response output text requires an annotations array',
					});
				}
			}
		}
	}
	const status = hint<{ present: boolean; value?: unknown; finish?: GenerateMessageFinishReason }>(response, 'status');
	if (status && status.finish === choice?.finishReason) {
		if (status.present) wire.status = status.value;
	} else {
		const reason = choice?.finishReason;
		wire.status =
			reason === 'error'
				? 'failed'
				: reason === 'length' || reason === 'content-filter' || reason === 'other' || reason === undefined
					? 'incomplete'
					: 'completed';
		if (reason === 'length' || reason === 'content-filter')
			wire.incomplete_details = {
				...record(wire.incomplete_details),
				reason: reason === 'length' ? 'max_output_tokens' : 'content_filter',
			};
	}
	if (response.usage) wire.usage = encodeUsage(response.usage, ctx);
	else if (hint(response, 'usageNull')) wire.usage = null;
	return wire as OpenAIResponsesResponse;
}

const kinds: Record<string, GenerateMessageErrorKind> = {
	invalid_request_error: 'invalid-request',
	authentication_error: 'authentication',
	permission_error: 'permission',
	not_found_error: 'not-found',
	rate_limit_exceeded: 'rate-limit',
	rate_limit_error: 'rate-limit',
	insufficient_quota: 'rate-limit',
	context_length_exceeded: 'context-length',
	server_error: 'server',
};
export function decodeError(input: { status?: number; body: unknown }): GenerateMessageError {
	const body = record(input.body);
	const inner = isRecord(body.error) ? body.error : body;
	const error = readFields<GenerateMessageError>(
		{
			kind: kinds[String(inner.code)] ?? kinds[String(inner.type)] ?? errorKindFromStatus(input.status),
			message: typeof inner.message === 'string' ? inner.message : 'Unknown Responses error',
			status: input.status,
		},
		inner,
		{ code: 'code', param: 'param' },
		['type', 'message'],
	);
	mark(error, 'errorType', { present: 'type' in inner, value: inner.type });
	mark(error, 'envelope', { wrapped: isRecord(body.error) });
	if (isRecord(body.error))
		error.extensions = {
			[API]: { ...pickExtensions(API, body, ['error'])?.[API], error: error.extensions?.[API] ?? {} },
		};
	return error;
}
export function encodeError(error: GenerateMessageError, ctx: Ctx): { status: number; body: unknown } {
	const envelope = hint<GenerateMessageNode & { wrapped: boolean }>(error, 'envelope');
	const source = envelope?.wrapped
		? { ...error, extensions: { ...error.extensions, [API]: record(error.extensions?.[API]?.error) } }
		: error;
	const wire = writeFields(source, { code: 'code', param: 'param' }, ctx, 'error', { message: error.message });
	const original = hint<{ present: boolean; value: unknown }>(error, 'errorType');
	if (original) {
		if (original.present) wire.type = original.value;
	} else wire.type = Object.keys(kinds).find((key) => kinds[key] === error.kind) ?? 'server_error';
	const outer = { ...error.extensions?.[API] };
	delete outer.error;
	return {
		status: error.status ?? statusFromErrorKind(error.kind),
		body:
			envelope?.wrapped === false
				? wire
				: applyExtensions(
						API,
						envelope?.wrapped ? { extensions: { [API]: outer } } : undefined,
						{ error: wire },
						ctx,
						'errorEnvelope',
					),
	};
}
