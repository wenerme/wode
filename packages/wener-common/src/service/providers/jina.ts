import { JinaReaderClient } from '@wener/client/jina';
import type { CliServiceConfig } from '../config';
import type { IFetchService } from '../fetch';
import type { ServiceProviderDefinition } from '../registry';
import {
	assertSupportedKeys,
	type FetchImplementation,
	getCallSignal,
	isPlainRecord,
	limitContent,
	normalizeHeaders,
	parseFetchRequest,
	sanitizeFetchError,
	throwIfAborted,
	validateHttpUrl,
	validatePositiveSafeInteger,
} from './fetch-utils';

export interface JinaFetchServiceOptions {
	fetch?: FetchImplementation;
	baseUrl?: string;
	headers?: HeadersInit;
	apiKey?: string;
	timeout?: number;
}

function parseJinaConfig(config: CliServiceConfig): JinaFetchServiceOptions {
	try {
		const baseUrl =
			config.baseUrl === undefined ? undefined : validateHttpUrl(config.baseUrl, 'Invalid Jina service configuration');
		const headers = normalizeHeaders(config.headers);
		const options =
			config.options === undefined
				? {}
				: assertSupportedKeys(config.options, ['apiKey', 'timeout'], 'Invalid Jina service configuration');
		const apiKey = options.apiKey;
		if (apiKey !== undefined && (typeof apiKey !== 'string' || !apiKey.trim())) throw new Error();
		const timeout = validatePositiveSafeInteger(options.timeout, 'timeout');
		if (timeout !== undefined && timeout > 2_147_483_647) throw new Error();
		return { baseUrl, headers, apiKey, timeout };
	} catch {
		throw new Error('Invalid Jina fetch service configuration');
	}
}

function createJinaFetchOptions(options: JinaFetchServiceOptions): {
	fetch?: FetchImplementation;
	baseUrl?: string;
	headers?: Record<string, string>;
	timeout?: number;
} {
	try {
		assertSupportedKeys(
			options,
			['fetch', 'baseUrl', 'headers', 'apiKey', 'timeout'],
			'Invalid Jina fetch service configuration',
		);
		if (options.fetch !== undefined && typeof options.fetch !== 'function') throw new Error();
		const baseUrl =
			options.baseUrl === undefined
				? undefined
				: validateHttpUrl(options.baseUrl, 'Invalid Jina fetch service configuration');
		const headers = normalizeHeaders(options.headers);
		if (options.apiKey !== undefined && (typeof options.apiKey !== 'string' || !options.apiKey.trim()))
			throw new Error();
		const timeout = validatePositiveSafeInteger(options.timeout, 'timeout');
		if (timeout !== undefined && timeout > 2_147_483_647) throw new Error();
		return {
			fetch: options.fetch,
			baseUrl,
			headers: {
				...(headers ?? {}),
				...(options.apiKey === undefined ? {} : { authorization: `Bearer ${options.apiKey}` }),
			},
			timeout,
		};
	} catch {
		throw new Error('Invalid Jina fetch service configuration');
	}
}

export function createJinaFetchService(options: JinaFetchServiceOptions = {}): IFetchService {
	const clientOptions = createJinaFetchOptions(options);
	let client: JinaReaderClient | undefined;
	return {
		type: 'jina',
		readOnly: true,
		async fetch(input, callOptions) {
			const signal = getCallSignal(callOptions);
			throwIfAborted(signal);
			const { url, maxCharacters } = parseFetchRequest(input);
			client ??= new JinaReaderClient(clientOptions);
			try {
				const response = await client.read(url, signal ? { signal } : undefined);
				throwIfAborted(signal);
				const data = isPlainRecord(response.data) ? response.data : {};
				const content = typeof data.content === 'string' ? data.content : '';
				const title = typeof data.title === 'string' ? data.title : undefined;
				const responseUrl = typeof data.url === 'string' && data.url ? data.url : url;
				const metadata = isPlainRecord(data.metadata) ? data.metadata : undefined;
				return {
					url: responseUrl,
					content: limitContent(content, maxCharacters),
					...(title === undefined ? {} : { title }),
					...(metadata === undefined ? {} : { metadata }),
				};
			} catch (error) {
				throwIfAborted(signal);
				sanitizeFetchError(error, 'Jina fetch aborted', 'Jina fetch failed');
			}
		},
	};
}

export const JinaFetchServiceProvider: ServiceProviderDefinition<'fetch'> = {
	name: 'jina',
	provides: ['fetch'],
	create({ config, fetch }) {
		return { fetch: createJinaFetchService({ ...parseJinaConfig(config), fetch }) };
	},
};
