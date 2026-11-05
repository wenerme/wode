import { SqlMethodInputs, SqlServiceContract } from '../sql/contract';
import type { ServiceSchema } from './types';

export const SqlToolInputs = SqlMethodInputs;

export const SqlTools: ServiceSchema['tools'] = Object.fromEntries(
	Object.entries(SqlServiceContract.methods).map(([name, method]) => [
		name,
		{
			description: method.description,
			inputSchema: method.inputSchema,
			outputSchema: method.outputSchema,
			annotations: { readOnlyHint: name !== 'exec', destructiveHint: name === 'exec' },
		},
	]),
);
