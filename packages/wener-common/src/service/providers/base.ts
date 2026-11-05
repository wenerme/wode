import { z } from 'zod';
import type { CliServiceConfig } from '../config';
import { type IFetchService, parseFetchRequest } from '../fetch';
import {
	extractHtmlTitle,
	htmlToReadableMarkdown,
	normalizeFetchContent,
	responseSecrets,
	sanitizeServiceResponse,
} from '../fetch/content';
import type { ServiceProviderDefinition } from '../registry';
import {
	assertSupportedKeys,
	type FetchImplementation,
	getCallSignal,
	normalizeHeaders,
	sanitizeFetchError,
	throwIfAborted,
} from './fetch-utils';

export const BaseFetchServiceOptionsSchema = z.strictObject({});

export interface BaseFetchServiceOptions {
	fetch?: FetchImplementation;
	headers?: HeadersInit;
}

function createBaseFetchOptions(config: CliServiceConfig): BaseFetchServiceOptions {
	try {
		if (config.baseUrl !== undefined) throw new Error();
		const options =
			config.options === undefined
				? {}
				: assertSupportedKeys(config.options, [], 'Invalid fetch service configuration');
		if (Object.keys(options).length > 0) throw new Error();
		return { headers: normalizeHeaders(config.headers) };
	} catch {
		throw new Error('Invalid base fetch service configuration');
	}
}

export function createBaseFetchService(options: BaseFetchServiceOptions = {}): IFetchService {
	try {
		assertSupportedKeys(options, ['fetch', 'headers'], 'Invalid fetch service configuration');
		if (options.fetch !== undefined && typeof options.fetch !== 'function') throw new Error();
		const headers = normalizeHeaders(options.headers);
		const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
		return {
			type: 'base',
			readOnly: true,
			async fetch(input, callOptions) {
				const signal = getCallSignal(callOptions);
				throwIfAborted(signal);
				const request = parseFetchRequest(input);
				const { url } = request;
				try {
					const response = await fetcher(url, {
						...(headers ? { headers } : {}),
						...(signal ? { signal } : {}),
						...(request.live ? { cache: 'no-store' } : {}),
					});
					throwIfAborted(signal);
					if (!response.ok) throw new Error('HTTP response was not successful');
					const body = await response.text();
					throwIfAborted(signal);
					const contentType = response.headers.get('content-type') ?? undefined;
					const isHtml = Boolean(contentType?.toLowerCase().includes('html')) || /<html[\s>]/iu.test(body);
					const title = isHtml ? extractHtmlTitle(body) : undefined;
					const result = {
						url: response.url || url,
						content: normalizeFetchContent(
							isHtml ? htmlToReadableMarkdown(body, request.main !== false) : body,
							request,
							title,
						),
						...(contentType ? { contentType } : {}),
						...(title ? { title } : {}),
						...(request.metadata ? { metadata: { status: response.status, statusText: response.statusText } } : {}),
						...(request.raw
							? { raw: { url: response.url || url, status: response.status, contentType, content: body } }
							: {}),
					};
					return sanitizeServiceResponse(result, responseSecrets(headers)) as typeof result;
				} catch (error) {
					throwIfAborted(signal);
					if (error instanceof Error && error.message === 'HTTP response was not successful')
						throw new Error('Fetch request failed');
					sanitizeFetchError(error, 'Fetch request aborted', 'Fetch request failed');
				}
			},
		};
	} catch {
		throw new Error('Invalid base fetch service configuration');
	}
}

export const BaseFetchServiceProvider: ServiceProviderDefinition<'fetch'> = {
	name: 'base',
	aliases: ['direct'],
	provides: ['fetch'],
	optionsSchema: BaseFetchServiceOptionsSchema,
	create({ config, fetch }) {
		return { fetch: createBaseFetchService({ ...createBaseFetchOptions(config), fetch }) };
	},
};
