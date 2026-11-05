import {
	ExaClient,
	type ExaClientInit,
	type ExaContentsRequest,
	type ExaContentsResponse,
	type ExaSearchContentsOptions,
	type ExaSearchRequest,
	type ExaSearchResponse,
} from '@wener/client/exa';
import { z } from 'zod';
import type { CliServiceConfig } from '../../config';
import { type IFetchService, parseFetchRequest } from '../../fetch';
import { normalizeFetchContent, responseSecrets, sanitizeServiceResponse } from '../../fetch/content';
import type { ServiceProviderDefinition } from '../../registry';
import { type ISearchService, type SearchContentOptions, SearchRequestSchema } from '../../search';
import { getCallSignal, normalizeHeaders, sanitizeFetchError, throwIfAborted, validateHttpUrl } from '../../fetch/fetch-utils';
import { FetchOperations } from '../../fetch';
import { SearchOperations } from '../../search';
import { FetchServiceCapability } from '../../fetch/IFetchService';
import { SearchServiceCapability } from '../../search/ISearchService';

export const ExaServiceOptionsSchema = z.strictObject({
	apiKey: z
		.string()
		.trim()
		.min(1)
		.optional()
		.describe(
			'Exa API key; supports env://NAME through the host configuration resolver. May also be supplied in the x-api-key header.',
		),
	timeout: z.number().int().min(1).max(2_147_483_647).optional().describe('Request timeout in milliseconds.'),
});

export interface ExaServiceOptions {
	apiKey?: string;
	timeout?: number;
	baseUrl?: string;
	headers?: HeadersInit;
	fetch?: typeof globalThis.fetch;
}

function parseOptions(options: ExaServiceOptions): ExaClientInit {
	try {
		const { apiKey, timeout } = ExaServiceOptionsSchema.parse({ apiKey: options.apiKey, timeout: options.timeout });
		if (Object.keys(options).some((key) => !['apiKey', 'timeout', 'baseUrl', 'headers', 'fetch'].includes(key)))
			throw new Error();
		if (options.fetch !== undefined && typeof options.fetch !== 'function') throw new Error();
		const headers = normalizeHeaders(options.headers);
		if (!apiKey && !headers?.['x-api-key'] && !headers?.authorization) throw new Error();
		return {
			apiKey,
			timeout,
			headers,
			fetch: options.fetch,
			baseUrl: options.baseUrl === undefined ? undefined : validateHttpUrl(options.baseUrl),
		};
	} catch {
		throw new Error('Invalid Exa service configuration');
	}
}

function contentOptions(input: SearchContentOptions = {}, textDefault = false): ExaSearchContentsOptions {
	return {
		text: (input.text ?? textDefault) ? (input.maxCharacters ? { maxCharacters: input.maxCharacters } : true) : false,
		summary: input.summary,
		highlights:
			(input.highlights ?? !textDefault)
				? input.maxCharacters
					? { maxCharacters: input.maxCharacters }
					: true
				: false,
		maxAgeHours: input.live ? 0 : undefined,
	};
}

/** Both capabilities share one client; transport and protocol stay in @wener/client/exa. */
export function createExaService(options: ExaServiceOptions): { search: ISearchService; fetch: IFetchService } {
	const clientOptions = parseOptions(options);
	const client = new ExaClient(clientOptions);
	const secrets = responseSecrets(clientOptions.headers, clientOptions.apiKey);
	const sanitize = <T>(value: T): T => sanitizeServiceResponse(value, secrets) as T;
	return {
		search: {
			type: 'exa',
			readOnly: true,
			async search(input, callOptions) {
				const signal = getCallSignal(callOptions);
				throwIfAborted(signal);
				const parsed = SearchRequestSchema.safeParse(input);
				if (!parsed.success) throw new TypeError('Invalid Exa search request');
				const request = parsed.data;
				if (request.cursor !== undefined || request.range !== undefined)
					throw new TypeError('Unsupported Exa search option: cursor/range; use from/to and offset');
				const offset = request.offset ?? 0;
				const limit = request.limit ?? 10;
				if (limit + offset > 100) throw new TypeError('Exa search limit plus offset must be at most 100');
				const domains = [
					...new Set([
						...(request.includeDomains ?? []),
						...(request.urls ?? []).map((url) => new URL(validateHttpUrl(url, 'Invalid Exa search URL')).hostname),
					]),
				];
				const date = (value: string | Date | undefined) => (value instanceof Date ? value.toISOString() : value);
				const body: ExaSearchRequest = {
					query: request.query,
					type: request.searchType,
					category: request.category,
					numResults: limit + offset,
					includeDomains: domains.length ? domains : undefined,
					excludeDomains: request.excludeDomains,
					startPublishedDate: date(request.from),
					endPublishedDate: date(request.to),
					contents: contentOptions(request.content),
				};
				try {
					const response = await client.request<ExaSearchResponse, ExaSearchRequest>({
						method: 'POST',
						path: 'search',
						body,
						signal,
					});
					throwIfAborted(signal);
					return sanitize({
						items: response.results.slice(offset, offset + limit).map((item) => ({
							url: item.url,
							title: item.title,
							text: item.text,
							summary: item.summary,
							highlights: item.highlights,
							publishedAt: item.publishedDate ?? undefined,
							...(item.author ? { metadata: { author: item.author } } : {}),
						})),
						metadata: {
							requestId: response.requestId,
							searchType: response.searchType,
							costDollars: response.costDollars,
						},
						...(request.raw ? { raw: response } : {}),
					});
				} catch (error) {
					throwIfAborted(signal);
					sanitizeFetchError(error, 'Exa search aborted', 'Exa search failed');
				}
			},
		},
		fetch: {
			type: 'exa',
			readOnly: true,
			async fetch(input, callOptions) {
				const signal = getCallSignal(callOptions);
				throwIfAborted(signal);
				const request = parseFetchRequest(input);
				const body: ExaContentsRequest = { urls: [request.url], ...contentOptions(request, true) };
				try {
					const response = await client.request<ExaContentsResponse, ExaContentsRequest>({
						method: 'POST',
						path: 'contents',
						body,
						signal,
					});
					throwIfAborted(signal);
					if (response.statuses?.some((status) => status.status === 'error')) throw new Error('Exa fetch failed');
					const item = response.results.find((item) => item.url === request.url || item.id === request.url);
					if (!item) throw new Error('Exa fetch failed');
					const content =
						(request.summary && item?.summary) ||
						item?.text ||
						item?.summary ||
						item?.highlights?.find((value) => value.trim()) ||
						'';
					return sanitize({
						url: item?.url ?? request.url,
						title: item?.title,
						content: normalizeFetchContent(content, request, item?.title),
						summary: item?.summary,
						highlights: item?.highlights,
						publishedDate: item?.publishedDate ?? undefined,
						author: item?.author ?? undefined,
						...(request.metadata
							? {
									metadata: {
										requestId: response.requestId,
										status: response.statuses?.[0],
										costDollars: response.costDollars,
									},
								}
							: {}),
						...(request.raw ? { raw: response } : {}),
					});
				} catch (error) {
					throwIfAborted(signal);
					sanitizeFetchError(error, 'Exa fetch aborted', 'Exa fetch failed');
				}
			},
		},
	};
}

function configOptions(config: CliServiceConfig): ExaServiceOptions {
	const parsed = ExaServiceOptionsSchema.safeParse(config.options ?? {});
	if (!parsed.success) throw new Error('Invalid Exa service configuration');
	return { ...parsed.data, baseUrl: config.baseUrl, headers: config.headers };
}

export const ExaServiceProvider: ServiceProviderDefinition<ISearchService | IFetchService> = {
	name: 'exa',
	provides: [SearchServiceCapability, FetchServiceCapability],
	optionsSchema: ExaServiceOptionsSchema,
	operations: { ...SearchOperations, ...FetchOperations },
	create({ config, fetch }) {
		return createExaService({ ...configOptions(config), fetch });
	},
};
