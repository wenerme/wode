import type { ServiceSchema } from '../runtime/types';
import { toJsonSchema } from '../../schema';
import { SqlMethodInputs, SqlServiceContract } from './SqlServiceContract';

/** SQL-owned compatibility metadata; new operations derive directly from the oRPC router. */
export const SqlToolInputs = SqlMethodInputs;
export const SqlTools: ServiceSchema['tools'] = Object.fromEntries(
	Object.entries(SqlServiceContract).map(([name, procedure]) => [name, {
		description: procedure['~orpc'].meta.description,
		inputSchema: toJsonSchema(procedure['~orpc'].inputSchema!),
		outputSchema: toJsonSchema(procedure['~orpc'].outputSchema!),
		annotations: {
			readOnlyHint: procedure['~orpc'].meta.readOnlyHint,
			destructiveHint: procedure['~orpc'].meta.destructiveHint,
		},
	}]),
);
