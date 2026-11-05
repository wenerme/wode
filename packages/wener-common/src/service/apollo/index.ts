import type { ServiceProviderDefinition } from '../registry';
import { ApolloServiceOptionsSchema } from './core/config';
import { createApolloService } from './core/createApolloService';
import type { IApolloService } from './core/interface';
import { ApolloOperations } from './operations';
import { ApolloServiceCapability } from './core/interface';

export * from './core';
export * as ApolloCore from './core';
export type ApolloService = IApolloService;

export const ApolloServiceProvider: ServiceProviderDefinition<IApolloService> = {
	name: 'apollo',
	provides: [ApolloServiceCapability],
	optionsSchema: ApolloServiceOptionsSchema,
	operations: ApolloOperations,
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
