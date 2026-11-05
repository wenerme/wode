import type { ServiceProviderDefinition } from '../registry';
import { LinearServiceOptionsSchema, resolveLinearConnectionOptions } from '../linear/config';
import { LinearServiceContract } from '../linear/contract';
import { createLinearService } from '../linear/createLinearService';
import { LinearServiceError, LinearServiceErrorCodes } from '../linear/errors';
import { LinearOperations } from '../linear/operations';

export const LinearServiceProvider: ServiceProviderDefinition<'linear'> = {
	name: 'linear',
	provides: ['linear'],
	title: 'Linear',
	description: 'Read and manage Linear teams, issues, projects, users and comments through GraphQL.',
	documentationUrl: 'https://developers.linear.app/docs/graphql/working-with-the-graphql-api',
	examples: [
		{ command: 'woctl linear status', description: 'Show the authenticated user.' },
		{ command: 'woctl linear issue list', description: 'List issues.' },
	],
	optionsSchema: LinearServiceOptionsSchema,
	contract: LinearServiceContract,
	operations: LinearOperations,
	async create(context) {
		if (context.config.headers && Object.keys(context.config.headers).length) {
			throw new LinearServiceError(LinearServiceErrorCodes.InvalidConfig, 'Linear service configuration is invalid');
		}
		const connection = resolveLinearConnectionOptions({
			baseUrl: context.config.baseUrl, readOnly: context.config.readOnly,
			options: context.config.options,
		}, context.getEnv);
		return { linear: await createLinearService(connection, { fetch: context.fetch }) };
	},
};
