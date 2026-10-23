import { type ServiceCliDefinition, ServiceCliInputError, serviceCliString } from '@wener/common/service/cli';
import { parseDuckDuckGoSearchInput } from '@wener/common/service/providers/duckduckgo';
import type { ISearchService } from '@wener/common/service/search';

export const DuckDuckGoCliDefinition: ServiceCliDefinition<Pick<ISearchService, 'search'>> = {
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
				const input = parseDuckDuckGoSearchInput({ query: args[0], limit: number('limit'), offset: number('offset') });
				return (client, options) => client.search(input, options);
			},
		},
	],
};
