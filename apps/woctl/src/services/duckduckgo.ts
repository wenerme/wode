import { type ServiceCliDefinition, ServiceCliInputError, serviceCliString } from '@wener/common/service/cli';
import { parseDuckDuckGoSearchInput } from '@wener/common/service/providers/duckduckgo';
import type { ISearchService } from '@wener/common/service/search';

export const DuckDuckGoCliDefinition: ServiceCliDefinition<Pick<ISearchService, 'search'>> = {
	name: 'duckduckgo',
	aliases: ['ddg'],
	description: 'DuckDuckGo search',
	helpText:
		'baseUrl sets the instant answer endpoint; options supports instantAnswerBaseUrl (overrides baseUrl), htmlBaseUrl, userAgent and timeout (milliseconds).',
	commands: [
		{
			name: 'search',
			description: 'Search keywords; uses HTML search directly when offset is greater than zero',
			arguments: '<query>',
			mutating: false,
			options: [
				{ name: 'limit', description: 'Maximum number of results; defaults to 10' },
				{ name: 'offset', description: 'HTML search result offset; defaults to 0' },
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
