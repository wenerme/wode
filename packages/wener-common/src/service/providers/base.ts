import type { CliServiceConfig } from '../config';
import type { IFetchService } from '../fetch';
import type { ServiceProviderDefinition } from '../registry';
import { z } from 'zod';

export const BaseFetchServiceOptionsSchema = z.strictObject({});
import {
	assertSupportedKeys,
	type FetchImplementation,
	getCallSignal,
	limitContent,
	normalizeHeaders,
	parseFetchRequest,
	sanitizeFetchError,
	throwIfAborted,
} from './fetch-utils';

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
				const { url, maxCharacters } = parseFetchRequest(input);
				try {
					const response = await fetcher(url, { ...(headers ? { headers } : {}), ...(signal ? { signal } : {}) });
					throwIfAborted(signal);
					if (!response.ok) throw new Error('HTTP response was not successful');
					const content = await response.text();
					throwIfAborted(signal);
					const contentType = response.headers.get('content-type') ?? undefined;
					return {
						url: response.url || url,
						content: limitContent(content, maxCharacters),
						...(contentType ? { contentType } : {}),
					};
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
