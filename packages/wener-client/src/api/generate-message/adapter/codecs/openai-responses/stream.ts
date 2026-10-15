import { type OpenAIResponsesStreamEvent, OpenAIResponsesStreamEventSchema } from '../../../../openai-responses/schema';
import type { GenerateMessageStreamTransform } from '../../codec';
import type {
	GenerateMessageNode,
	GenerateMessagePart,
	GenerateMessageResponse,
	GenerateMessageStreamEvent,
	GenerateMessageUsage,
} from '../../types';
import { applyExtensions, isRecord, withHint } from '../../utils';
import {
	API,
	type Ctx,
	decodeBlock,
	decodeError,
	decodeItems,
	decodeResponse,
	decodeUsage,
	drop,
	encodeBlock,
	encodeError,
	encodeItemPart,
	encodeResponse,
	hint,
	itemPart,
	record,
	type Wire,
} from './mapping';

type Event = GenerateMessageStreamEvent;
type DecodedPart = {
	index: number;
	part: GenerateMessagePart;
	ended: boolean;
	summaries: Map<number, string>;
	texts: Map<number, string>;
};

function append(part: GenerateMessagePart, delta: Extract<Event, { type: 'part-delta' }>['delta']): void {
	if (delta.text !== undefined) {
		if (part.type === 'text' || part.type === 'refusal') part.text += delta.text;
		else if (part.type === 'reasoning') part.text = (part.text ?? '') + delta.text;
	}
	if (delta.arguments !== undefined && part.type === 'tool-call') part.arguments += delta.arguments;
	if (delta.summary !== undefined && part.type === 'reasoning') {
		part.summary ??= [''];
		if (!part.summary.length) part.summary.push('');
		part.summary[part.summary.length - 1] += delta.summary;
	}
	if (delta.signature !== undefined && part.type === 'reasoning')
		part.signature = { api: part.signature?.api ?? API, value: (part.signature?.value ?? '') + delta.signature };
}

export function createStreamDecoder(_ctx: Ctx): GenerateMessageStreamTransform<OpenAIResponsesStreamEvent, Event> {
	const parts = new Map<string, DecodedPart>();
	const items = new Map<number, Wire>();
	let nextIndex = 0;
	let started = false;
	let ended = false;
	let finished = false;
	const keyFor = (oi: number, ci = 0) => (items.get(oi)?.type === 'message' ? `${oi}:content:${ci}` : `${oi}:item`);
	function start(key: string, part: GenerateMessagePart, out: Event[]): DecodedPart {
		const old = parts.get(key);
		if (old) return old;
		const itemId = items.get(Number(key.split(':')[0]))?.id;
		if (typeof itemId === 'string') withHint(part, API, 'streamItemId', itemId);
		const state: DecodedPart = {
			index: nextIndex++,
			part: structuredClone(part),
			ended: false,
			summaries: new Map(),
			texts: new Map(),
		};
		parts.set(key, state);
		out.push({ type: 'part-start', choice: 0, index: state.index, role: 'assistant', part: structuredClone(part) });
		return state;
	}
	function close(state: DecodedPart, out: Event[], part?: GenerateMessagePart): void {
		if (state.ended) return;
		if (part) state.part = withHint(part, API, 'streamItemId', hint(state.part, 'streamItemId'));
		state.ended = true;
		out.push({ type: 'part-end', choice: 0, index: state.index, part: structuredClone(state.part) });
	}
	function item(oi: number, wire: Wire, done: boolean, out: Event[]): void {
		items.set(oi, wire);
		if (wire.type === 'message') {
			const blocks =
				typeof wire.content === 'string'
					? [{ type: 'output_text', text: wire.content }]
					: Array.isArray(wire.content)
						? wire.content
						: [];
			for (const [ci, block] of blocks.entries()) {
				const part = decodeBlock(block);
				const state = start(keyFor(oi, ci), part, out);
				if (done) close(state, out, part);
			}
		} else {
			const part = decodeItems([wire])[0]?.content[0];
			if (part) {
				const state = start(keyFor(oi), part, out);
				if (done) close(state, out, part);
			}
		}
	}
	return {
		push(input) {
			if (ended) return [];
			const wire: Wire = input;
			const type = String(wire.type);
			const out: Event[] = [];
			const oi = typeof wire.output_index === 'number' ? wire.output_index : 0;
			const ci = typeof wire.content_index === 'number' ? wire.content_index : 0;
			if (type === 'response.created' || type === 'response.in_progress') {
				if (!started) {
					started = true;
					const response = record(wire.response);
					out.push({
						type: 'start',
						id: typeof response.id === 'string' ? response.id : undefined,
						model: typeof response.model === 'string' ? response.model : undefined,
						created: typeof response.created_at === 'number' ? response.created_at : undefined,
					});
				}
				return out;
			}
			if (type === 'response.output_item.added' || type === 'response.output_item.done') {
				item(oi, record(wire.item), type.endsWith('.done'), out);
				return out;
			}
			if (type === 'response.content_part.added' || type === 'response.content_part.done') {
				if (!items.has(oi)) items.set(oi, { type: 'message', id: wire.item_id });
				const part = decodeBlock(wire.part);
				const state = start(keyFor(oi, ci), part, out);
				if (type.endsWith('.done')) close(state, out, part);
				return out;
			}
			if (
				[
					'response.reasoning_summary_part.added',
					'response.reasoning_summary_part.done',
					'response.reasoning_part.added',
					'response.reasoning_part.done',
				].includes(type)
			) {
				if (!items.has(oi)) items.set(oi, { type: 'reasoning', id: wire.item_id });
				const summary = type.includes('summary');
				const state = start(
					keyFor(oi),
					summary ? { type: 'reasoning', summary: [] } : { type: 'reasoning', text: '' },
					out,
				);
				const si = summary && typeof wire.summary_index === 'number' ? wire.summary_index : ci;
				const text = record(wire.part).text;
				const map = summary ? state.summaries : state.texts;
				if (typeof text === 'string') map.set(si, text);
				if (state.part.type === 'reasoning') {
					const texts = [...map.entries()].sort(([a], [b]) => a - b).map(([, text]) => text);
					if (summary) state.part.summary = texts;
					else state.part.text = texts.join('');
				}
				return out;
			}
			const deltaTypes: Record<string, 'text' | 'arguments' | 'summary'> = {
				'response.output_text.delta': 'text',
				'response.refusal.delta': 'text',
				'response.function_call_arguments.delta': 'arguments',
				'response.custom_tool_call_input.delta': 'arguments',
				'response.reasoning_summary_text.delta': 'summary',
				'response.reasoning_text.delta': 'text',
			};
			const deltaField = deltaTypes[type];
			const doneField = deltaTypes[type.replace(/\.done$/, '.delta')];
			if (deltaField || (type.endsWith('.done') && doneField)) {
				const reasoning = type.includes('reasoning');
				const call = type.includes('function_call') || type.includes('custom_tool_call');
				if (!items.has(oi))
					items.set(oi, { type: reasoning ? 'reasoning' : call ? 'function_call' : 'message', id: wire.item_id });
				const empty: GenerateMessagePart = reasoning
					? { type: 'reasoning' }
					: call
						? {
								type: 'tool-call',
								id: String(wire.call_id ?? wire.item_id ?? ''),
								name: typeof wire.name === 'string' ? wire.name : '',
								arguments: '',
								toolType: type.includes('custom_tool') ? 'custom' : 'function',
							}
						: { type: type.includes('refusal') ? 'refusal' : 'text', text: '' };
				const state = start(keyFor(oi, ci), empty, out);
				if (state.ended) return out;
				const field = deltaField ?? doneField;
				const value = deltaField
					? wire.delta
					: wire[
							field === 'arguments'
								? type.includes('custom_tool')
									? 'input'
									: 'arguments'
								: type.includes('refusal')
									? 'refusal'
									: 'text'
						];
				if (typeof value !== 'string') return out;
				if (deltaField) {
					const delta = { [field]: value };
					append(state.part, delta);
					const event: Extract<Event, { type: 'part-delta' }> & GenerateMessageNode = {
						type: 'part-delta',
						choice: 0,
						index: state.index,
						delta,
					};
					if (field === 'summary')
						withHint(event, API, 'summaryIndex', typeof wire.summary_index === 'number' ? wire.summary_index : 0);
					if (_ctx.source === API && _ctx.target === API) withHint(event, API, 'wireType', type);
					out.push(event);
				}
				if (reasoning && state.part.type === 'reasoning') {
					const si = field === 'summary' && typeof wire.summary_index === 'number' ? wire.summary_index : ci;
					const map = field === 'summary' ? state.summaries : state.texts;
					map.set(si, deltaField ? (map.get(si) ?? '') + value : value);
					const texts = [...map.entries()].sort(([a], [b]) => a - b).map(([, text]) => text);
					if (field === 'summary') state.part.summary = texts;
					else state.part.text = texts.join('');
				} else if (!deltaField) {
					if (state.part.type === 'tool-call') state.part.arguments = value;
					else if (state.part.type === 'text' || state.part.type === 'refusal') state.part.text = value;
				}
				return out;
			}
			if (['response.completed', 'response.incomplete', 'response.failed'].includes(type)) {
				if (finished) {
					_ctx.report({
						code: 'lossy',
						path: 'stream.finish',
						api: API,
						message: 'Repeated Responses stream finish ignored by decoder',
					});
					return [];
				}
				finished = true;
				const response = decodeResponse(wire.response as Parameters<typeof decodeResponse>[0]);
				for (const [index, value] of ((record(wire.response).output as unknown[]) ?? []).entries())
					item(index, record(value), true, out);
				for (const state of parts.values()) close(state, out);
				if (response.usage) out.push({ type: 'usage', usage: response.usage });
				if (type === 'response.failed' || record(wire.response).status === 'failed') {
					const error = decodeError({
						body: {
							error: record(wire.response).error ?? { code: 'server_error', message: 'Upstream response failed' },
						},
					});
					out.push(withHint<Extract<Event, { type: 'error' }>>({ type: 'error', error }, API, 'failedResponse', wire));
					return out;
				}
				out.push(
					withHint<Extract<Event, { type: 'finish' }>>(
						{ type: 'finish', choice: 0, finishReason: response.choices[0]?.finishReason },
						API,
						'response',
						response,
					),
				);
				return out;
			}
			if (type === 'error') {
				out.push({
					type: 'error',
					error: decodeError({
						body: isRecord(wire.error)
							? { error: wire.error }
							: {
									message: wire.message ?? '',
									code: wire.code,
									param: wire.param,
									...(wire.error_type !== undefined ? { type: wire.error_type } : {}),
								},
					}),
				});
				return out;
			}
			if (isRecord(wire.usage)) return [{ type: 'usage', usage: decodeUsage(wire.usage) }];
			return [{ type: 'native', api: API, value: input }];
		},
		end() {
			if (ended) return [];
			ended = true;
			const out: Event[] = [];
			for (const state of parts.values()) close(state, out);
			return out;
		},
	};
}

type EncodedPart = {
	index: number;
	outputIndex: number;
	id: string;
	part: GenerateMessagePart;
	done: boolean;
	item: Wire;
	summaryStarted: Set<number>;
	textStarted: boolean;
};
export function createStreamEncoder(ctx: Ctx): GenerateMessageStreamTransform<Event, OpenAIResponsesStreamEvent> {
	let sequence = 0;
	let started = false;
	let ended = false;
	let id: string | undefined;
	let model = ctx.request?.model ?? ctx.model;
	let created: number | undefined;
	let usage: GenerateMessageUsage | undefined;
	let missingModelReported = false;
	let finish: Extract<Event, { type: 'finish' }> | undefined;
	let finishReceived = false;
	const parts = new Map<number, EncodedPart>();
	const output: Wire[] = [];
	const event = (type: string, fields: Wire = {}) =>
		OpenAIResponsesStreamEventSchema.parse({ ...fields, type, sequence_number: sequence++ });
	function response(status: string): Wire {
		if (model === undefined) {
			model = '';
			if (!missingModelReported) {
				missingModelReported = true;
				ctx.report({
					code: 'lossy',
					path: 'model',
					api: API,
					message: 'Missing Responses stream model encoded as an empty string',
				});
			}
		}
		id ??= ctx.generateId('resp');
		created ??= ctx.now();
		const original = hint<GenerateMessageResponse>(finish, 'response');
		const common: GenerateMessageResponse = {
			...original,
			id,
			model,
			created,
			choices: [{ index: 0, message: { role: 'assistant', content: [] }, finishReason: finish?.finishReason }],
			usage,
		};
		const wire: Wire = encodeResponse(common, ctx);
		wire.status = status;
		wire.output = structuredClone(output);
		return wire;
	}
	function ensureStart(out: OpenAIResponsesStreamEvent[]): void {
		if (started) return;
		out.push(event('response.created', { response: response('in_progress') }));
		started = true;
	}
	function fields(state: EncodedPart): Wire {
		return { output_index: state.outputIndex, item_id: state.id };
	}
	function contentFields(state: EncodedPart): Wire {
		return { ...fields(state), content_index: 0 };
	}
	function start(index: number, part: GenerateMessagePart, out: OpenAIResponsesStreamEvent[]): EncodedPart | undefined {
		if (parts.has(index)) return parts.get(index);
		const itemLike = itemPart(part);
		let item: Wire | undefined;
		let block: Wire | undefined;
		if (itemLike) item = encodeItemPart(part, ctx, `stream.parts[${index}]`);
		else {
			block = encodeBlock(part, 'assistant', ctx, `stream.parts[${index}]`);
			if (block) item = { type: 'message', role: 'assistant', content: [], status: 'in_progress' };
		}
		if (!item) return;
		ensureStart(out);
		let itemId =
			typeof item.id === 'string'
				? item.id
				: (hint<string>(part, 'streamItemId') ??
					ctx.generateId(part.type === 'tool-call' ? 'fc' : part.type === 'reasoning' ? 'rs' : 'msg'));
		if (output.some((previous) => previous.id === itemId))
			itemId = ctx.generateId(part.type === 'tool-call' ? 'fc' : part.type === 'reasoning' ? 'rs' : 'msg');
		item.id = itemId;
		if (part.type === 'tool-call') item[part.toolType === 'custom' ? 'input' : 'arguments'] = '';
		if (part.type === 'reasoning') {
			if (part.summary !== undefined) item.summary = [];
			if (part.text !== undefined) item.content = [];
		}
		if (block && (part.type === 'text' || part.type === 'refusal'))
			block[part.type === 'text' ? 'text' : 'refusal'] = '';
		if (['message', 'function_call', 'custom_tool_call', 'reasoning'].includes(String(item.type)))
			item.status = 'in_progress';
		const state: EncodedPart = {
			index,
			outputIndex: output.length,
			id: itemId,
			part: structuredClone(part),
			done: false,
			item,
			summaryStarted: new Set(),
			textStarted: false,
		};
		parts.set(index, state);
		output.push(item);
		out.push(event('response.output_item.added', { output_index: state.outputIndex, item: structuredClone(item) }));
		if (block) {
			item.content = [block];
			out.push(event('response.content_part.added', { ...contentFields(state), part: block }));
		}
		emitRemainder(state, undefined, part, out);
		return state;
	}
	function reasoningStart(state: EncodedPart, summary: boolean, out: OpenAIResponsesStreamEvent[], index = 0): void {
		if (summary ? state.summaryStarted.has(index) : state.textStarted) return;
		if (summary) state.summaryStarted.add(index);
		else state.textStarted = true;
		if (summary)
			out.push(
				event('response.reasoning_summary_part.added', {
					...fields(state),
					summary_index: index,
					part: { type: 'summary_text', text: '' },
				}),
			);
	}
	/** Final snapshots may supply text omitted by an interrupted delta sequence. */
	function emitRemainder(
		state: EncodedPart,
		previous: GenerateMessagePart | undefined,
		final: GenerateMessagePart,
		out: OpenAIResponsesStreamEvent[],
	): void {
		function emit(type: string, text: string, before: string, extra: Wire): void {
			if (text === before) return;
			if (!text.startsWith(before)) {
				ctx.report({
					code: 'lossy',
					path: `stream.parts[${state.index}]`,
					api: API,
					message: 'Final snapshot replaced text already emitted as deltas',
				});
				return;
			}
			out.push(event(type, { ...extra, delta: text.slice(before.length) }));
		}
		if (final.type === 'text' || final.type === 'refusal')
			emit(
				final.type === 'text' ? 'response.output_text.delta' : 'response.refusal.delta',
				final.text,
				previous?.type === final.type ? previous.text : '',
				contentFields(state),
			);
		else if (final.type === 'tool-call')
			emit(
				final.toolType === 'custom'
					? 'response.custom_tool_call_input.delta'
					: 'response.function_call_arguments.delta',
				final.arguments,
				previous?.type === 'tool-call' ? previous.arguments : '',
				fields(state),
			);
		else if (final.type === 'reasoning') {
			for (const [si, text] of (final.summary ?? []).entries()) {
				const before = previous?.type === 'reasoning' ? (previous.summary?.[si] ?? '') : '';
				if (text !== before) reasoningStart(state, true, out, si);
				emit('response.reasoning_summary_text.delta', text, before, { ...fields(state), summary_index: si });
			}
			if (final.text !== undefined) {
				const before = previous?.type === 'reasoning' ? (previous.text ?? '') : '';
				if (final.text !== before) reasoningStart(state, false, out);
				emit('response.reasoning_text.delta', final.text, before, contentFields(state));
			}
		}
	}
	function close(state: EncodedPart, out: OpenAIResponsesStreamEvent[]): void {
		if (state.done) return;
		state.done = true;
		const part = state.part;
		let item: Wire;
		if (itemPart(part)) {
			item = encodeItemPart(part, ctx, `stream.parts[${state.index}]`) ?? state.item;
			if (part.type === 'tool-call')
				out.push(
					event(
						part.toolType === 'custom'
							? 'response.custom_tool_call_input.done'
							: 'response.function_call_arguments.done',
						{ ...fields(state), [part.toolType === 'custom' ? 'input' : 'arguments']: part.arguments },
					),
				);
			if (part.type === 'reasoning') {
				for (const [si, text] of (part.summary ?? []).entries()) {
					reasoningStart(state, true, out, si);
					out.push(event('response.reasoning_summary_text.done', { ...fields(state), summary_index: si, text }));
					out.push(
						event('response.reasoning_summary_part.done', {
							...fields(state),
							summary_index: si,
							part: { type: 'summary_text', text },
						}),
					);
				}
				if (part.text !== undefined) {
					reasoningStart(state, false, out);
					out.push(event('response.reasoning_text.done', { ...contentFields(state), text: part.text }));
				}
			}
		} else {
			const block = encodeBlock(part, 'assistant', ctx, `stream.parts[${state.index}]`);
			item = { type: 'message', role: 'assistant', content: block ? [block] : [] };
			if (part.type === 'text')
				out.push(event('response.output_text.done', { ...contentFields(state), text: part.text }));
			if (part.type === 'refusal')
				out.push(event('response.refusal.done', { ...contentFields(state), refusal: part.text }));
			if (block) out.push(event('response.content_part.done', { ...contentFields(state), part: block }));
		}
		item.id = state.id;
		if (['message', 'function_call', 'custom_tool_call', 'reasoning'].includes(String(item.type)))
			item.status = 'completed';
		state.item = item;
		output[state.outputIndex] = item;
		out.push(event('response.output_item.done', { output_index: state.outputIndex, item: structuredClone(item) }));
	}
	return {
		push(input) {
			if (ended) return [];
			const out: OpenAIResponsesStreamEvent[] = [];
			if ('choice' in input && input.choice !== 0) {
				drop(ctx, `stream.choices[${input.choice}]`, 'Responses supports one choice');
				return [];
			}
			switch (input.type) {
				case 'start':
					id ??= input.id;
					if (!started) model = input.model ?? model;
					created ??= input.created;
					applyExtensions(API, input, {}, ctx, 'stream.start');
					ensureStart(out);
					break;
				case 'part-start':
					if (input.role && input.role !== 'assistant' && input.part.type !== 'tool-result')
						drop(ctx, `stream.parts[${input.index}].role`, 'Responses stream output uses assistant role');
					applyExtensions(API, input, {}, ctx, `stream.parts[${input.index}]`);
					start(input.index, input.part, out);
					break;
				case 'part-delta': {
					const state = parts.get(input.index);
					if (!state || state.done) {
						drop(ctx, `stream.parts[${input.index}]`, 'Delta requires an open part');
						break;
					}
					const { part } = state;
					for (const [key, value] of Object.entries(input.delta)) {
						if (value === undefined) continue;
						if (key === 'signature') {
							if (part.type === 'reasoning' && (!part.signature || part.signature.api === API))
								append(part, { signature: value });
							else drop(ctx, `stream.parts[${input.index}].signature`, 'Signature cannot be written to this part');
							continue;
						}
						let type: string | undefined;
						let extra = contentFields(state);
						if (key === 'arguments' && part.type === 'tool-call') {
							type =
								part.toolType === 'custom'
									? 'response.custom_tool_call_input.delta'
									: 'response.function_call_arguments.delta';
							extra = fields(state);
						}
						if (key === 'text' && (part.type === 'text' || part.type === 'refusal'))
							type = part.type === 'text' ? 'response.output_text.delta' : 'response.refusal.delta';
						const summaryIndex = hint<number>(input as GenerateMessageNode, 'summaryIndex') ?? 0;
						if (part.type === 'reasoning' && (key === 'summary' || key === 'text')) {
							reasoningStart(state, key === 'summary', out, key === 'summary' ? summaryIndex : 0);
							type = key === 'summary' ? 'response.reasoning_summary_text.delta' : 'response.reasoning_text.delta';
							if (key === 'summary') extra = { ...fields(state), summary_index: summaryIndex };
						}
						if (ctx.source === API && ctx.target === API) {
							const wireType = hint<string>(input as GenerateMessageNode, 'wireType');
							if (wireType) type = wireType;
						}
						if (type) {
							if (part.type === 'reasoning' && key === 'summary') {
								part.summary ??= [];
								part.summary[summaryIndex] = (part.summary[summaryIndex] ?? '') + value;
							} else append(part, { [key]: value });
							out.push(event(type, { ...extra, delta: value }));
						} else drop(ctx, `stream.parts[${input.index}].${key}`, 'Delta does not match part type');
					}
					break;
				}
				case 'part-end': {
					const state = parts.get(input.index) ?? (input.part ? start(input.index, input.part, out) : undefined);
					if (state && !state.done) {
						if (input.part) {
							emitRemainder(state, state.part, input.part, out);
							state.part = structuredClone(input.part);
						}
						close(state, out);
					}
					break;
				}
				case 'usage':
					usage = input.usage;
					break;
				case 'finish':
					if (finishReceived) {
						ctx.report({
							code: 'lossy',
							path: 'stream.0.finish',
							api: API,
							message: 'Repeated Responses stream finish ignored',
						});
						break;
					}
					finishReceived = true;
					finish = input;
					applyExtensions(API, input, {}, ctx, 'stream.finish');
					break;
				case 'error': {
					const failed = hint<Wire>(input, 'failedResponse');
					if (ctx.source === API && ctx.target === API && failed?.type === 'response.failed') {
						out.push(structuredClone(failed) as OpenAIResponsesStreamEvent);
						ended = true;
						break;
					}
					const wire = record(encodeError(input.error, ctx).body);
					const error = isRecord(wire.error) ? wire.error : wire;
					delete error.type;
					out.push(event('error', { error }));
					finish ??= { type: 'finish', choice: 0, finishReason: 'error' };
					break;
				}
				case 'native':
					if (input.api === API && isRecord(input.value)) {
						const value = structuredClone(input.value);
						if (
							(value.type === 'response.content_part.added' || value.type === 'response.content_part.done') &&
							isRecord(value.part) &&
							value.part.type !== 'output_text' &&
							value.part.type !== 'refusal' &&
							typeof value.part.text === 'string'
						) {
							value.part = { type: 'output_text', text: value.part.text };
							ctx.report({
								code: 'lossy',
								path: 'stream.part',
								api: API,
								message: 'Unsupported content part normalized to output_text',
							});
						}
						const { type, sequence_number: _sequence, ...fields } = value;
						out.push(event(String(type), fields));
					}
					break;
			}
			return out;
		},
		end() {
			if (ended) return [];
			const out: OpenAIResponsesStreamEvent[] = [];
			ensureStart(out);
			for (const state of parts.values()) close(state, out);
			const reason = finish?.finishReason;
			const status =
				reason === 'error'
					? 'failed'
					: !finish || reason === undefined || reason === 'length' || reason === 'content-filter' || reason === 'other'
						? 'incomplete'
						: 'completed';
			out.push(event(`response.${status}`, { response: response(status) }));
			ended = true;
			return out;
		},
	};
}
