import { DuckDuckGoClient, type DuckDuckGoClientInit, type DuckDuckGoSearchResponse } from '@wener/client/duckduckgo';
import { z } from 'zod';
import type { CliServiceConfig } from '../../config';
import type { ServiceProviderDefinition } from '../../registry';
import type { ISearchService, SearchRequest } from '../../search';
import { SearchOperations, SearchRequestSchema } from '../../search';
import { SearchServiceCapability } from '../../search/ISearchService';

const httpUrl = z
	.string()
	.url()
	.refine((value) => {
		const url = new URL(value);
		return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
	});

export const DuckDuckGoServiceOptionsSchema = z.strictObject({
	instantAnswerBaseUrl: httpUrl.optional(),
	htmlBaseUrl: httpUrl.optional(),
	// Must be a valid header value; checked with Headers below since Zod cannot express it.
	userAgent: z.string().regex(/\S/).optional(),
	timeout: z.number().int().min(1).max(2_147_483_647).optional(),
});

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const supportedSearchOptions = new Set(['query', 'limit', 'offset', 'range', 'raw']);

function parseSearchRequest(input: unknown): SearchRequest {
	const parsed = SearchRequestSchema.safeParse(input);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		const key = issue?.path[0];
		if (key === 'query' || !isRecord(input)) throw new TypeError('DuckDuckGo search requires a non-empty query');
		if (key === 'limit' || key === 'offset')
			throw new TypeError(`DuckDuckGo ${key} must be an integer >= ${key === 'limit' ? 1 : 0}`);
		throw new TypeError('Unsupported DuckDuckGo search option');
	}
	// No silent ignore: reject valid search options DuckDuckGo cannot honor.
	const unsupported = Object.entries(parsed.data).filter(
		([key, value]) => value !== undefined && !supportedSearchOptions.has(key),
	);
	if (unsupported.length) throw new TypeError('Unsupported DuckDuckGo search option');
	return parsed.data;
}

export function parseDuckDuckGoClientOptions(config: CliServiceConfig): DuckDuckGoClientInit {
	try {
		const options = DuckDuckGoServiceOptionsSchema.parse(config.options === undefined ? {} : config.options);
		// baseUrl configures Instant Answer; HTML fallback has its own explicit endpoint.
		const baseUrl = config.baseUrl === undefined ? undefined : httpUrl.parse(config.baseUrl);
		if (
			config.headers !== undefined &&
			(!isRecord(config.headers) || Object.values(config.headers).some((value) => typeof value !== 'string'))
		)
			throw new Error();
		const headers = new Headers(config.headers);
		const { userAgent, timeout } = options;
		// Validation only: Headers rejects invalid header values such as newlines.
		if (userAgent !== undefined) new Headers({ 'user-agent': userAgent });
		return {
			instantAnswerBaseUrl: options.instantAnswerBaseUrl ?? baseUrl,
			htmlBaseUrl: options.htmlBaseUrl,
			headers: Object.fromEntries(headers.entries()),
			userAgent,
			timeout,
		};
	} catch {
		throw new Error('Invalid DuckDuckGo service configuration');
	}
}

export function createDuckDuckGoSearchService(options: DuckDuckGoClientInit = {}): ISearchService {
	let client: DuckDuckGoClient | undefined;
	return {
		type: 'duckduckgo',
		readOnly: true,
		async search(input, { signal } = {}) {
			signal?.throwIfAborted();
			const { query, limit, offset, range, raw } = parseSearchRequest(input);
			client ??= new DuckDuckGoClient(options);
			try {
				const response = await client.search({ query, count: limit, offset, range, signal });
				signal?.throwIfAborted();
				const result = {
					items: response.results.map(({ url, title, snippet }) => ({ url, title, summary: snippet })),
					metadata: { query: response.query, source: response.source },
					// Raw is the client's supplier JSON/HTML, or its search response when no supplier body exists.
					...(raw
						? { raw: response.raw ?? { query: response.query, results: response.results, source: response.source } }
						: {}),
				};
				return result;
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
