import { DuckDuckGoClient, type DuckDuckGoSearchResponse, type DuckDuckGoClientInit } from '@wener/client/duckduckgo';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import type { ServiceCallOptions, ServiceProvider, ServiceSchema } from '../runtime/types';
import {
	DuckDuckGoSearchServiceProvider,
	createDuckDuckGoSearchService,
	parseDuckDuckGoClientOptions,
	DuckDuckGoServiceOptionsSchema,
} from '../provider/duckduckgo';

/** @deprecated Use `SearchRequest` from `@wener/common/service/search`. */
export interface DuckDuckGoSearchInput {
	query: string;
	limit?: number;
	offset?: number;
}

/** @deprecated Use the client from `@wener/client/duckduckgo` directly. */
export interface DuckDuckGoServiceClient {
	search(input: DuckDuckGoSearchInput, options?: ServiceCallOptions): Promise<DuckDuckGoSearchResponse>;
}

const schema: ServiceSchema = {
	tools: {
		search: {
			description: 'Search DuckDuckGo, falling back to HTML search when instant answers are empty',
			inputSchema: {
				type: 'object',
				properties: {
					query: { type: 'string', minLength: 1, pattern: '\\S' },
					limit: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER, default: 10 },
					offset: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER, default: 0 },
				},
				required: ['query'],
				additionalProperties: false,
			},
			annotations: { readOnlyHint: true, destructiveHint: false },
		},
	},
};

/** @deprecated Use `SearchRequestSchema` from `@wener/common/service/search`. */
export function parseDuckDuckGoSearchInput(value: unknown): DuckDuckGoSearchInput {
	try {
		if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new TypeError();
		const input = value as Record<string, unknown>;
		if (Object.keys(input).some((key) => !['query', 'limit', 'offset'].includes(key)) || typeof input.query !== 'string' || !input.query.trim())
			throw new TypeError('DuckDuckGo search requires a non-empty query and optional limit/offset');
		for (const [key, minimum] of [['limit', 1], ['offset', 0]] as const) {
			const number = input[key];
			if (number !== undefined && (typeof number !== 'number' || !Number.isSafeInteger(number) || number < minimum))
				throw new TypeError(`DuckDuckGo ${key} must be an integer >= ${minimum}`);
		}
		return { query: input.query, limit: input.limit as number | undefined, offset: input.offset as number | undefined };
	} catch (error) {
		throw new ServiceCliInputError(error instanceof TypeError ? (error.message || 'DuckDuckGo search requires a non-empty query and optional limit/offset') : 'Invalid DuckDuckGo search input');
	}
}

/** @deprecated Use `DuckDuckGoSearchServiceProvider` with `createServiceProviderAdapter`. */
export function createDuckDuckGoProvider(): ServiceProvider {
	return {
		name: 'duckduckgo',
		create({ config, fetch }) {
			let client: DuckDuckGoClient | undefined;
			return {
				async getSchema() {
					return structuredClone(schema);
				},
				async call(tool, input, { signal } = {}) {
					signal?.throwIfAborted();
					if (tool !== 'search') throw new ServiceCliInputError('Unknown DuckDuckGo operation');
					const { query, limit, offset } = parseDuckDuckGoSearchInput(input);
					client ??= new DuckDuckGoClient({ ...parseDuckDuckGoClientOptions(config), fetch });
					try {
						const result = await client.search({ query, count: limit, offset, signal });
						signal?.throwIfAborted();
						return result;
					} catch (error) {
						signal?.throwIfAborted();
						if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError'))
							throw new DOMException('DuckDuckGo search aborted', error.name);
						throw new Error('DuckDuckGo search failed');
					}
				},
			};
		},
	};
}

export {
	DuckDuckGoSearchServiceProvider,
	DuckDuckGoServiceOptionsSchema,
	createDuckDuckGoSearchService,
	parseDuckDuckGoClientOptions,
};
export type { DuckDuckGoClientInit };
