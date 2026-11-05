import { DuckDuckGoClient, type DuckDuckGoClientInit, type DuckDuckGoSearchResponse } from '@wener/client/duckduckgo';
import { z } from 'zod';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import type { CliServiceConfig } from '../config';
import { responseSecrets, sanitizeServiceResponse } from '../fetch/content';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceCallOptions, ServiceProvider, ServiceSchema } from '../runtime/types';
import type { ISearchService } from '../search';
import { SearchOperations } from '../search';
import { SearchServiceCapability } from '../search/ISearchService';

export const DuckDuckGoServiceOptionsSchema = z.strictObject({
	instantAnswerBaseUrl: z.string().url().optional(),
	htmlBaseUrl: z.string().url().optional(),
	userAgent: z.string().min(1).optional(),
	timeout: z.number().int().min(1).optional(),
});

export interface DuckDuckGoSearchInput {
	query: string;
	limit?: number;
	offset?: number;
}

/** @deprecated 兼容旧 tool transport；领域代码使用 ISearchService。 */
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseSearchInput(value: unknown): DuckDuckGoSearchInput {
	if (
		!isRecord(value) ||
		Object.keys(value).some((key) => !['query', 'limit', 'offset'].includes(key)) ||
		typeof value.query !== 'string' ||
		!value.query.trim()
	)
		throw new TypeError('DuckDuckGo search requires a non-empty query and optional limit/offset');
	for (const [key, minimum] of [
		['limit', 1],
		['offset', 0],
	] as const) {
		const number = value[key];
		if (number !== undefined && (typeof number !== 'number' || !Number.isSafeInteger(number) || number < minimum))
			throw new TypeError(`DuckDuckGo ${key} must be an integer >= ${minimum}`);
	}
	return { query: value.query, limit: value.limit as number | undefined, offset: value.offset as number | undefined };
}

/** CLI 兼容入口；领域实现使用与 CLI 无关的参数错误。 */
export function parseDuckDuckGoSearchInput(value: unknown): DuckDuckGoSearchInput {
	try {
		return parseSearchInput(value);
	} catch (error) {
		throw new ServiceCliInputError(error instanceof TypeError ? error.message : 'Invalid DuckDuckGo search input');
	}
}

export function parseDuckDuckGoClientOptions(config: CliServiceConfig): DuckDuckGoClientInit {
	try {
		const options = config.options === undefined ? {} : config.options;
		if (
			!isRecord(options) ||
			Object.keys(options).some((key) => !['instantAnswerBaseUrl', 'htmlBaseUrl', 'userAgent', 'timeout'].includes(key))
		)
			throw new Error();
		const url = (value: unknown): string | undefined => {
			if (value === undefined) return undefined;
			if (typeof value !== 'string' || !value.trim()) throw new Error();
			const parsed = new URL(value);
			if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
			return value;
		};
		// baseUrl configures Instant Answer; HTML fallback has its own explicit endpoint.
		const baseUrl = url(config.baseUrl);
		const instantAnswerBaseUrl = url(options.instantAnswerBaseUrl) ?? baseUrl;
		const htmlBaseUrl = url(options.htmlBaseUrl);
		const { userAgent, timeout } = options;
		if (userAgent !== undefined && (typeof userAgent !== 'string' || !userAgent.trim())) throw new Error();
		if (
			timeout !== undefined &&
			(typeof timeout !== 'number' || !Number.isSafeInteger(timeout) || timeout < 1 || timeout > 2_147_483_647)
		)
			throw new Error();
		if (
			config.headers !== undefined &&
			(!isRecord(config.headers) || Object.values(config.headers).some((value) => typeof value !== 'string'))
		)
			throw new Error();
		const headers = new Headers(config.headers);
		if (userAgent !== undefined) new Headers({ 'user-agent': userAgent as string });
		return {
			instantAnswerBaseUrl,
			htmlBaseUrl,
			headers: Object.fromEntries(headers.entries()),
			userAgent: userAgent as string | undefined,
			timeout: timeout as number | undefined,
		};
	} catch {
		throw new Error('Invalid DuckDuckGo service configuration');
	}
}

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

export function createDuckDuckGoSearchService(options: DuckDuckGoClientInit = {}): ISearchService {
	let client: DuckDuckGoClient | undefined;
	const secrets = responseSecrets(options.headers);
	return {
		type: 'duckduckgo',
		readOnly: true,
		async search(input, { signal } = {}) {
			signal?.throwIfAborted();
			if (!isRecord(input)) throw new TypeError('Invalid DuckDuckGo search input');
			if (
				Object.keys(input).some((key) => !['query', 'limit', 'offset', 'range', 'raw'].includes(key)) ||
				(input.range !== undefined && typeof input.range !== 'string') ||
				(input.raw !== undefined && typeof input.raw !== 'boolean')
			)
				throw new TypeError('Unsupported DuckDuckGo search option');
			const { query, limit, offset } = parseSearchInput({
				query: input.query,
				limit: input.limit,
				offset: input.offset,
			});
			client ??= new DuckDuckGoClient(options);
			try {
				const response = await client.search({ query, count: limit, offset, range: input.range, signal });
				signal?.throwIfAborted();
				const result = {
					items: response.results.map(({ url, title, snippet }) => ({ url, title, summary: snippet })),
					metadata: { query: response.query, source: response.source },
					// Raw is the client's supplier JSON/HTML, or its search response when no supplier body exists.
					...(input.raw
						? { raw: response.raw ?? { query: response.query, results: response.results, source: response.source } }
						: {}),
				};
				return sanitizeServiceResponse(result, secrets) as typeof result;
			} catch (error) {
				signal?.throwIfAborted();
				if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError'))
					throw new DOMException('DuckDuckGo search aborted', error.name);
				throw new Error('DuckDuckGo search failed');
			}
		},
	};
}

export const DuckDuckGoSearchServiceProvider: ServiceProviderDefinition<ISearchService> = {
	name: 'duckduckgo',
	aliases: ['ddg'],
	provides: [SearchServiceCapability],
	optionsSchema: DuckDuckGoServiceOptionsSchema,
	operations: SearchOperations,
	create({ config, fetch }) {
		return { search: createDuckDuckGoSearchService({ ...parseDuckDuckGoClientOptions(config), fetch }) };
	},
};
