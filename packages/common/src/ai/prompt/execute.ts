import type {
	GenerateMessageFinishReason,
	GenerateMessagePart,
	GenerateMessageResponse,
	GenerateMessageStreamEvent,
	GenerateMessageUsage,
} from '@wener/client/api/generate-message';

import { preparePromptExchange } from './request';
import { readSse } from './sse';
import type { PromptExecutionOptions, PromptRequest, PromptResult } from './types';

type PartState = { part: GenerateMessagePart; role: string };
type ChoiceState = { parts: Map<number, PartState>; finishReason?: GenerateMessageFinishReason };

function abortError(): Error {
	const error = new Error('Prompt request was aborted');
	error.name = 'AbortError';
	return error;
}

function appendDelta(
	part: GenerateMessagePart,
	delta: Extract<GenerateMessageStreamEvent, { type: 'part-delta' }>['delta'],
): void {
	if (delta.text !== undefined) {
		if (part.type === 'text' || part.type === 'refusal') part.text += delta.text;
		else if (part.type === 'reasoning') part.text = (part.text ?? '') + delta.text;
	}
	if (delta.arguments !== undefined && part.type === 'tool-call') part.arguments += delta.arguments;
	if (delta.summary !== undefined && part.type === 'reasoning') {
		part.summary ??= [''];
		part.summary[part.summary.length - 1] = (part.summary[part.summary.length - 1] ?? '') + delta.summary;
	}
	if (delta.signature !== undefined && part.type === 'reasoning')
		part.signature = {
			api: part.signature?.api ?? 'openai-responses',
			value: (part.signature?.value ?? '') + delta.signature,
		};
}

function responseText(response: GenerateMessageResponse): string {
	return (
		response.choices[0]?.message.content.reduce((text, part) => (part.type === 'text' ? text + part.text : text), '') ??
		''
	);
}

async function errorBody(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		return undefined;
	}
}

function asEvent(data: string, event: string | undefined): unknown {
	const value: unknown = JSON.parse(data);
	if (!event || !value || typeof value !== 'object' || Array.isArray(value) || 'type' in value) return value;
	return { ...value, type: event };
}

export async function executePrompt(input: PromptRequest, options: PromptExecutionOptions = {}): Promise<PromptResult> {
	if (options.signal?.aborted) throw abortError();
	const { prepared, codec, context } = preparePromptExchange(input);
	const fetcher = options.fetch ?? globalThis.fetch;
	if (!fetcher) throw new Error('Prompt execution requires fetch');
	let response: Response;
	try {
		response = await fetcher(prepared.url, {
			method: prepared.method,
			headers: prepared.headers,
			body: JSON.stringify(prepared.body),
			signal: options.signal,
		});
	} catch {
		if (options.signal?.aborted) throw abortError();
		throw new Error('Prompt request failed');
	}
	if (options.signal?.aborted) {
		void response.body?.cancel().catch(() => undefined);
		throw abortError();
	}
	if (!response.ok) {
		codec.decodeError({ status: response.status, body: await errorBody(response) }, context);
		throw new Error(`Prompt request failed with HTTP ${response.status}`);
	}
	if (!input.stream) {
		let wire: unknown;
		try {
			wire = await response.json();
		} catch {
			if (options.signal?.aborted) throw abortError();
			throw new Error('Prompt provider returned invalid JSON');
		}
		if (options.signal?.aborted) throw abortError();
		context.phase = 'response';
		const decoded = codec.decodeResponse(wire, context);
		if (!decoded.choices.length) throw new Error('Prompt provider returned no choices');
		return {
			text: responseText(decoded),
			...(decoded.model === undefined ? {} : { model: decoded.model }),
			response: decoded,
			...(decoded.usage === undefined ? {} : { usage: decoded.usage }),
			diagnostics: context.diagnostics,
		};
	}
	if (!response.body) throw new Error('Prompt provider returned an empty stream');
	const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
	if (contentType && contentType !== 'text/event-stream') {
		void response.body.cancel().catch(() => undefined);
		throw new Error('Prompt provider returned an unexpected stream content type');
	}

	context.phase = 'stream';
	const decoder = codec.createStreamDecoder(context);
	const choices = new Map<number, ChoiceState>();
	let id: string | undefined;
	let model: string | undefined;
	let created: number | undefined;
	let usage: GenerateMessageUsage | undefined;
	let providerError: string | undefined;
	let ended = false;
	let done = false;
	const finished = new Set<number>();
	const choice = (index: number): ChoiceState => {
		let state = choices.get(index);
		if (!state) {
			state = { parts: new Map() };
			choices.set(index, state);
		}
		return state;
	};
	const apply = (events: GenerateMessageStreamEvent[]) => {
		if (options.signal?.aborted) return;
		for (const event of events) {
			switch (event.type) {
				case 'start':
					id ??= event.id;
					model ??= event.model;
					created ??= event.created;
					break;
				case 'part-start': {
					const state = choice(event.choice);
					state.parts.set(event.index, { part: structuredClone(event.part), role: event.role ?? 'assistant' });
					if (event.choice === 0 && event.part.type === 'text' && event.part.text) options.onText?.(event.part.text);
					break;
				}
				case 'part-delta': {
					const part = choice(event.choice).parts.get(event.index);
					if (!part) break;
					appendDelta(part.part, event.delta);
					if (event.choice === 0 && part.part.type === 'text' && event.delta.text) options.onText?.(event.delta.text);
					break;
				}
				case 'part-end': {
					const state = choice(event.choice);
					const previous = state.parts.get(event.index);
					if (event.part)
						state.parts.set(event.index, { part: structuredClone(event.part), role: previous?.role ?? 'assistant' });
					break;
				}
				case 'finish':
					choice(event.choice).finishReason = event.finishReason;
					if (!ended) finished.add(event.choice);
					break;
				case 'usage':
					usage = {
						...usage,
						...Object.fromEntries(Object.entries(event.usage).filter(([, value]) => value !== undefined)),
					};
					break;
				case 'error':
					providerError = event.error.kind;
					break;
			}
		}
	};
	const finish = () => {
		if (ended) return;
		ended = true;
		apply(decoder.end());
	};
	try {
		for await (const frame of readSse(response.body, options.signal)) {
			if (options.signal?.aborted) throw abortError();
			if (frame.data === '[DONE]') {
				done = true;
				break;
			}
			try {
				apply(decoder.push(asEvent(frame.data, frame.event)));
			} catch {
				throw new Error('Prompt provider returned invalid stream data');
			}
			if (providerError) break;
		}
	} catch (error) {
		if (options.signal?.aborted) throw abortError();
		throw error;
	} finally {
		finish();
	}
	if (options.signal?.aborted) throw abortError();
	if (providerError) throw new Error(`Prompt stream failed (${providerError})`);
	if (!choices.size || (!done && [...choices.keys()].some((index) => !finished.has(index))))
		throw new Error('Prompt provider stream ended before completion');
	const decoded: GenerateMessageResponse = {
		...(id === undefined ? {} : { id }),
		...(model === undefined ? {} : { model }),
		...(created === undefined ? {} : { created }),
		choices: [...choices.entries()]
			.sort(([a], [b]) => a - b)
			.map(([index, state]) => ({
				index,
				message: {
					role: [...state.parts.values()][0]?.role ?? 'assistant',
					content: [...state.parts.entries()].sort(([a], [b]) => a - b).map(([, part]) => part.part),
				},
				...(state.finishReason === undefined ? {} : { finishReason: state.finishReason }),
			})),
		...(usage === undefined ? {} : { usage }),
	};
	return {
		text: responseText(decoded),
		...(decoded.model === undefined ? {} : { model: decoded.model }),
		response: decoded,
		...(usage === undefined ? {} : { usage }),
		diagnostics: context.diagnostics,
	};
}
