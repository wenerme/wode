import type { ServiceProviderDefinition } from '../registry';
import { ApolloTools } from '../runtime/apollo-tools';
import { ApolloServiceOptionsSchema } from './core/config';
import { createApolloService } from './core/createApolloService';
import type { IApolloService } from './core/interface';

export * from './core';
export * as ApolloCore from './core';
export type ApolloService = IApolloService;

export const ApolloServiceProvider: ServiceProviderDefinition<'apollo'> = {
	name: 'apollo',
	provides: ['apollo'],
	optionsSchema: ApolloServiceOptionsSchema,
	contract: {
		methods: Object.fromEntries(
			Object.entries(ApolloTools).map(([name, tool]) => [
				name,
				{
					description: tool.description,
					inputSchema: tool.inputSchema,
					outputType: 'unknown',
				},
			]),
		),
	},
	create(context) {
		const parsed = ApolloServiceOptionsSchema.safeParse(context.config.options ?? {});
		if (!parsed.success) throw new Error('Invalid Apollo service options');
		return {
			apollo: createApolloService(
				{ ...parsed.data, readOnly: context.config.readOnly !== false },
				{ fetch: context.fetch },
			),
		};
	},
};
