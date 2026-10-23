import { DuckDuckGoClient, type DuckDuckGoClientInit, type DuckDuckGoSearchResponse } from '@wener/client/duckduckgo';
import type { CliServiceConfig } from 'common/context';
import type { ServiceCallOptions, ServiceProvider, ServiceSchema } from 'common/service';
import { type ServiceCliDefinition, ServiceCliInputError, serviceCliString } from 'common/service/cli';

export interface DuckDuckGoSearchInput {
	query: string;
	limit?: number;
	offset?: number;
}

export interface DuckDuckGoServiceClient {
	search(input: DuckDuckGoSearchInput, options?: ServiceCallOptions): Promise<DuckDuckGoSearchResponse>;
}

const schema: ServiceSchema = {
	tools: {
		search: {
			description: '搜索 DuckDuckGo，即时答案为空时使用 HTML 搜索',
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

function parseInput(value: unknown): DuckDuckGoSearchInput {
	if (
		!isRecord(value) ||
		Object.keys(value).some((key) => !['query', 'limit', 'offset'].includes(key)) ||
		typeof value.query !== 'string' ||
		!value.query.trim()
	)
		throw new ServiceCliInputError('DuckDuckGo search requires a non-empty query and optional limit/offset');
	for (const [key, minimum] of [
		['limit', 1],
		['offset', 0],
	] as const) {
		const number = value[key];
		if (number !== undefined && (typeof number !== 'number' || !Number.isSafeInteger(number) || number < minimum))
			throw new ServiceCliInputError(`DuckDuckGo ${key} must be an integer >= ${minimum}`);
	}
	return { query: value.query, limit: value.limit as number | undefined, offset: value.offset as number | undefined };
}

function parseClientOptions(config: CliServiceConfig): DuckDuckGoClientInit {
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
					const { query, limit, offset } = parseInput(input);
					client ??= new DuckDuckGoClient({ ...parseClientOptions(config), fetch });
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

export const DuckDuckGoCliDefinition: ServiceCliDefinition<DuckDuckGoServiceClient> = {
	name: 'duckduckgo',
	aliases: ['ddg'],
	description: 'DuckDuckGo 搜索',
	helpText:
		'baseUrl 配置即时答案端点；options 支持 instantAnswerBaseUrl（优先于 baseUrl）、htmlBaseUrl、userAgent 和 timeout（毫秒）。',
	commands: [
		{
			name: 'search',
			description: '搜索关键词；offset 大于零时直接使用 HTML 搜索',
			arguments: '<query>',
			mutating: false,
			options: [
				{ name: 'limit', description: '最多返回结果数，默认 10' },
				{ name: 'offset', description: 'HTML 搜索结果偏移，默认 0' },
			],
			prepare({ args, options }) {
				if (args.length !== 1) throw new ServiceCliInputError('DuckDuckGo search requires one query');
				const number = (name: string): number | undefined => {
					const value = serviceCliString(options, name);
					if (value === undefined) return undefined;
					if (!/^\d+$/.test(value)) throw new ServiceCliInputError(`DuckDuckGo ${name} must be an integer`);
					return Number(value);
				};
				const input = parseInput({ query: args[0], limit: number('limit'), offset: number('offset') });
				return (client, options) => client.search(input, options);
			},
		},
	],
};
