import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020';
import { generate } from 'json-schema-faker';
import { describe, test } from 'vitest';
import type { z } from 'zod';
import * as api from '../../src/api';
import { assertJsonStructureEqual, assertOfficialIncluded } from './assert-json';
import { generationView } from './generation-view';

type Schema = Record<string, unknown>;
type Contract = { name: string; target: string; schema: Schema };
type Oracle = { source: { url: string; sha256: string }; cases: Contract[]; $defs: Record<string, Schema> };

const fuzzEnabled = process.env.API_FUZZ === '1';
const seed = Number(process.env.API_FUZZ_SEED ?? 20261009);
const runs = Number(process.env.API_FUZZ_RUNS ?? 8);
if (fuzzEnabled) {
	assert(Number.isSafeInteger(seed), 'API_FUZZ_SEED must be an integer');
	assert(Number.isSafeInteger(runs) && runs >= 2, 'API_FUZZ_RUNS must be an integer >= 2');
}
const validators = new Ajv({ strict: false, validateFormats: false, allErrors: true, inlineRefs: false });
const parsers = api as unknown as Record<string, z.ZodType>;

const boundarySamples: Record<string, Record<string, unknown[]>> = {
	openai: {
		'POST /responses request': [
			{ input: [{ type: 'function_call_output', output: 'ok' }] },
			{ tools: [{ type: 'file_search', vector_store_ids: [], max_num_results: 0 }] },
			{ tools: [{ type: 'file_search', vector_store_ids: [], max_num_results: 2 ** 53 }] },
		],
		'POST /responses/input_tokens request': [{ input: [{ type: 'function_call_output', output: 'ok' }] }],
	},
	anthropic: {
		'POST /v1/messages/count_tokens response': [{ input_tokens: -1 }],
		'POST /v1/messages request': [
			{ model: 'claude-sonnet-4', messages: [], max_tokens: 0 },
			{ model: '', messages: [], max_tokens: 0 },
			{ model: 'm', messages: [], max_tokens: 2 ** 53 },
		],
		'POST /v1/messages stream': [
			{ type: 'content_block_delta', index: -1, delta: { type: 'text_delta', text: '' } },
			{ type: 'message_delta', delta: { stop_reason: null, stop_sequence: null }, usage: { output_tokens: -1 } },
		],
	},
	gemini: {
		'GenerateContentRequest -> GeminiGenerateContentRequestSchema': [
			{ model: '', contents: [], generationConfig: { candidateCount: 0, maxOutputTokens: 0 } },
		],
		'GenerateContentResponse -> GeminiGenerateContentResponseSchema': [
			{ candidates: [{ index: -1 }] },
			{ usageMetadata: { promptTokenCount: -1 } },
		],
		'CountTokensResponse -> GeminiCountTokensResponseSchema': [{ totalTokens: -1, cachedContentTokenCount: -1 }],
		'EmbedContentRequest -> GeminiEmbedContentRequestSchema': [{ model: 'm', content: {}, outputDimensionality: 0 }],
		'Part -> GenerateMessageWireContentPartSchema': [{ type: 'text' }, { type: 'tool_use' }],
		'Content -> GenerateMessageWireSchema': [{ role: 'user', content: [{ type: 'tool_use' }] }],
	},
};

function variants(schema: Schema, definitions: Record<string, Schema>, seen = new Set<string>()): Schema[] {
	if (typeof schema.$ref === 'string') {
		if (seen.has(schema.$ref)) return [schema];
		const name = schema.$ref.slice('#/$defs/'.length).replaceAll('~1', '/').replaceAll('~0', '~');
		return variants(definitions[name], definitions, new Set([...seen, schema.$ref]));
	}
	const branches = schema.oneOf ?? schema.anyOf;
	return Array.isArray(branches) ? branches.flatMap((branch) => variants(branch, definitions, seen)) : [schema];
}

for (const vendor of ['openai', 'anthropic', 'gemini']) {
	const oracle: Oracle = JSON.parse(readFileSync(new URL(`./oracles/${vendor}.json`, import.meta.url), 'utf8'));
	const id = `urn:wener:api-oracle:${vendor}`;
	validators.addSchema({ $id: id, $defs: oracle.$defs });
	function validationRefs(value: unknown): unknown {
		if (Array.isArray(value)) return value.map(validationRefs);
		if (value === null || typeof value !== 'object') return value;
		return Object.fromEntries(
			Object.entries(value).map(([key, child]) => [
				key,
				key === '$ref' && typeof child === 'string' ? `${id}${child}` : validationRefs(child),
			]),
		);
	}
	describe.skipIf(!fuzzEnabled)(`${vendor} official-inclusive (${oracle.source.sha256.slice(0, 12)})`, () => {
		for (const contract of oracle.cases) {
			test(`${contract.name} -> ${contract.target}`, async () => {
				if (process.env.API_FUZZ_TRACE) console.info(`${vendor}/${contract.name}`);
				assert(parsers[contract.target], `Missing local parser: ${contract.target}`);
				const validate = validators.compile(validationRefs(contract.schema) as Schema);
				for (const sample of boundarySamples[vendor]?.[contract.name.replace(/ \(common\)$/, '')] ?? []) {
					assertOfficialIncluded(validate, (value) => parsers[contract.target].parse(value), sample);
				}
				const branches = variants(contract.schema, oracle.$defs);
				for (const [branch, schema] of branches.entries()) {
					for (let run = 0; run < runs; run++) {
						let sample: unknown;
						let sampleSeed = seed + branch * 100_000 + run * 100;
						let valid = false;
						let lastError: unknown;
						for (let attempt = 0; attempt < 20; attempt++, sampleSeed++) {
							try {
								const generationSchema = generationView(schema, oracle.$defs, sampleSeed);
								const generated = await generate(generationSchema, {
									seed: sampleSeed,
									maxDepth: 32,
									maxDefaultItems: 2,
									minLength: 1,
									alwaysFakeOptionals: run % 2 === 0,
									optionalsProbability: run % 2 === 0 ? 1 : 0.25,
								});
								sample = JSON.parse(JSON.stringify(generated));
								assertJsonStructureEqual(generated, sample);
								if (validate(sample)) {
									valid = true;
									break;
								}
								lastError = validate.errors;
							} catch (error) {
								lastError = error;
							}
						}
						assert(
							valid,
							`${vendor}/${contract.name}: no valid official sample for branch=${branch}, run=${run}; ${lastError instanceof Error ? lastError.message : JSON.stringify(lastError)}`,
						);
						if (contract.name.replace(/ \(common\)$/, '') === 'POST /responses response' && run === 0) {
							const fractionalTimestamp = { ...(sample as Schema), created_at: 1.5 };
							assertOfficialIncluded(validate, (value) => parsers[contract.target].parse(value), fractionalTimestamp);
						}
						try {
							assertOfficialIncluded(validate, (value) => parsers[contract.target].parse(value), sample);
						} catch (error) {
							throw new Error(
								`${vendor}/${contract.name} -> ${contract.target}; seed=${sampleSeed}, branch=${branch}, run=${run}\nReason=${error instanceof Error ? error.message : String(error)}\nJSON=${JSON.stringify(sample)}`,
								{ cause: error },
							);
						}
					}
				}
			}, 30_000);
		}
	});
}
