import type { ServiceProviderDefinition } from '../registry';
import { createSqlService } from '../sql/createSqlService';

export const SqlServiceProvider: ServiceProviderDefinition<'sql'> = {
	name: 'sql',
	aliases: ['sqlite', 'postgres', 'postgresql', 'pg'],
	provides: ['sql'],
	async create(context) {
		if (typeof context.sqlDriver !== 'function') throw new Error('SQL driver is unavailable');
		const maxRowLimit = context.config.options?.maxRowLimit;
		if (
			maxRowLimit !== undefined &&
			(typeof maxRowLimit !== 'number' || !Number.isSafeInteger(maxRowLimit) || maxRowLimit < 1)
		)
			throw new Error('Invalid SQL service configuration');
		try {
			return {
				sql: createSqlService({
					adapter: await context.sqlDriver(context),
					readOnly: context.config.readOnly,
					type: 'sql',
					maxRowLimit: maxRowLimit as number | undefined,
				}),
			};
		} catch {
			throw new Error('SQL driver creation failed');
		}
	},
};
