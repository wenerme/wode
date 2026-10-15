import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { z } from 'zod';
import * as api from '../../src/api';
import {
	createGenerateMessageAdapter,
	defaultRequestProcessor,
	type GenerateMessageProcessor,
} from '../../src/api/generate-message/adapter';
import { ApiType } from '../../src/api/schema/ApiType';
import { assertJsonStructureEqual } from './assert-json';
import { compileContract, contractBranches, findContract, type OracleVendor, sampleOfficial } from './oracle-sampler';

/**
 * Converts official oracle samples between GenerateMessage protocols.
 * Same protocol: re-encoding must return the input unchanged with no diagnostics.
 * Cross protocol: output must satisfy the local Zod schema and the value view of the official schema
 * (types, enums, ranges of present fields; official `required` lists include server-filled fields).
 */
const fuzzEnabled = process.env.API_FUZZ === '1';
const seed = Number(process.env.API_FUZZ_SEED ?? 20261010);
const runs = Number(process.env.API_FUZZ_RUNS ?? 4);
const parsers = api as unknown as Record<string, z.ZodType>;

interface Protocol {
	api: ApiType;
	vendor: OracleVendor;
	request: string;
	response: string;
	stream?: string;
	requestSchema: string;
	responseSchema: string;
	streamSchema: string;
	model: string;
}

const protocols: Protocol[] = [
	{
		api: ApiType.OpenAIChatCompletions,
		vendor: 'openai',
		request: 'POST /chat/completions request',
		response: 'POST /chat/completions response',
		stream: 'POST /chat/completions stream',
		requestSchema: 'OpenAIChatCompletionsRequestSchema',
		responseSchema: 'OpenAIChatCompletionsResponseSchema',
		// Chat SSE also carries error envelopes, which have no completion choices array.
		streamSchema: 'OpenAIChatCompletionsStreamEventSchema',
		model: 'chat-model',
	},
	{
		api: ApiType.OpenAIResponses,
		vendor: 'openai',
		request: 'POST /responses request',
		response: 'POST /responses response',
		stream: 'POST /responses stream',
		requestSchema: 'OpenAIResponsesRequestSchema',
		responseSchema: 'OpenAIResponsesResponseSchema',
		streamSchema: 'OpenAIResponsesStreamEventSchema',
		model: 'responses-model',
	},
	{
		api: ApiType.AnthropicMessages,
		vendor: 'anthropic',
		request: 'POST /v1/messages request',
		response: 'POST /v1/messages response',
		requestSchema: 'AnthropicMessagesRequestSchema',
		responseSchema: 'AnthropicMessagesResponseSchema',
		streamSchema: 'AnthropicMessagesStreamEventSchema',
		model: 'anthropic-model',
	},
	{
		api: ApiType.GoogleGenerativeAI,
		vendor: 'gemini',
		request: 'GenerateContentRequest -> GeminiGenerateContentRequestSchema',
		response: 'GenerateContentResponse -> GeminiGenerateContentResponseSchema',
		stream: 'GenerateContentResponse -> GenerateMessageWireStreamEventSchema',
		requestSchema: 'GeminiGenerateContentRequestSchema',
		responseSchema: 'GeminiGenerateContentResponseSchema',
		streamSchema: 'GeminiGenerateContentResponseSchema',
		model: 'gemini-model',
	},
];

/** Failures that reflect a target requirement the source sample cannot satisfy, not a conversion bug. */
const expectedRejections = [/max_tokens/i, /requires? (a )?model/i];

function adapterFor(source: Protocol, target: Protocol) {
	let id = 0;
	const processors: GenerateMessageProcessor[] =
		source.api !== target.api && target.api === ApiType.AnthropicMessages
			? [defaultRequestProcessor({ maxOutputTokens: 1024 })]
			: [];
	return createGenerateMessageAdapter({
		source: source.api,
		target: target.api,
		model: source.api === ApiType.GoogleGenerativeAI ? source.model : undefined,
		processors,
		generateId: (prefix) => `${prefix}_${++id}`,
		now: () => 1_700_000_000,
	});
}

function assertJsonSafe(value: unknown, label: string) {
	assertJsonStructureEqual(JSON.parse(JSON.stringify(value)), value, label);
}

function parseLocal(schema: string, value: unknown, label: string) {
	assert(parsers[schema], `Missing local parser: ${schema}`);
	const result = parsers[schema].safeParse(value);
	assert(result.success, `${label}: ${schema} rejected\n${JSON.stringify(result.error?.issues?.slice(0, 5))}`);
}

function describeFailure(label: string, sampleSeed: number, sample: unknown, error: unknown): Error {
	return new Error(
		`${label}; seed=${sampleSeed}\nReason=${error instanceof Error ? error.message : String(error)}\nJSON=${JSON.stringify(sample).slice(0, 4000)}`,
		{ cause: error },
	);
}

async function* samples(protocol: Protocol, name: string) {
	const contract = findContract(protocol.vendor, name);
	const validate = compileContract(protocol.vendor, contract);
	for (const [branch, schema] of contractBranches(protocol.vendor, contract).entries()) {
		for (let run = 0; run < runs; run++) {
			yield await sampleOfficial(protocol.vendor, schema, validate, { seed: seed + branch * 100_000 + run * 100, run });
		}
	}
}

describe.skipIf(!fuzzEnabled)('GenerateMessage adapter conversion', () => {
	for (const source of protocols) {
		for (const target of protocols) {
			const pair = `${source.api} -> ${target.api}`;

			test(`request ${pair}`, async () => {
				const validateTarget = compileContract(target.vendor, findContract(target.vendor, target.request), {
					values: true,
				});
				for await (const { sample, seed: sampleSeed } of samples(source, source.request)) {
					const input = structuredClone(sample);
					const adapter = adapterFor(source, target);
					try {
						const { body } = await adapter.request(sample);
						assertJsonStructureEqual(input, sample, 'input mutated');
						assertJsonSafe(body, 'request body');
						if (source.api === target.api) {
							assertJsonStructureEqual(input, body, 'same-protocol request');
							assert.deepEqual(adapter.context.diagnostics, [], 'same-protocol request diagnostics');
							continue;
						}
						parseLocal(target.requestSchema, body, pair);
						assert(validateTarget(body), `official ${target.request}: ${JSON.stringify(validateTarget.errors)}`);
					} catch (error) {
						if (source.api !== target.api && expectedRejections.some((re) => re.test(String(error)))) continue;
						throw describeFailure(`request ${pair}`, sampleSeed, sample, error);
					}
				}
			}, 60_000);

			test(`response ${pair}`, async () => {
				const validateSource = compileContract(source.vendor, findContract(source.vendor, source.response), {
					values: true,
				});
				for await (const { sample, seed: sampleSeed } of samples(target, target.response)) {
					const input = structuredClone(sample);
					const adapter = adapterFor(source, target);
					try {
						const body = await adapter.response(sample);
						assertJsonStructureEqual(input, sample, 'input mutated');
						assertJsonSafe(body, 'response body');
						if (source.api === target.api) {
							assertJsonStructureEqual(input, body, 'same-protocol response');
							assert.deepEqual(adapter.context.diagnostics, [], 'same-protocol response diagnostics');
							continue;
						}
						parseLocal(source.responseSchema, body, pair);
						assert(validateSource(body), `official ${source.response}: ${JSON.stringify(validateSource.errors)}`);
					} catch (error) {
						throw describeFailure(`response ${pair}`, sampleSeed, sample, error);
					}
				}
			}, 60_000);

			if (!target.stream) continue;
			test(`stream event ${pair}`, async () => {
				const validateSource = source.stream
					? compileContract(source.vendor, findContract(source.vendor, source.stream), { values: true })
					: undefined;
				for await (const { sample, seed: sampleSeed } of samples(target, target.stream as string)) {
					const input = structuredClone(sample);
					const stream = adapterFor(source, target).stream();
					try {
						const events = [...stream.push(sample), ...stream.end()];
						assertJsonStructureEqual(input, sample, 'input mutated');
						for (const event of events) {
							assertJsonSafe(event, 'stream event');
							parseLocal(source.streamSchema, event, pair);
							if (validateSource) {
								assert(validateSource(event), `official ${source.stream}: ${JSON.stringify(validateSource.errors)}`);
							}
						}
					} catch (error) {
						throw describeFailure(`stream event ${pair}`, sampleSeed, sample, error);
					}
				}
			}, 60_000);
		}
	}
});
