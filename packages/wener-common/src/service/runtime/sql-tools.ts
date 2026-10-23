import { z } from 'zod';
import type { ServiceSchema } from './types';

const page = {
	limit: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
	offset: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
};
const object = z.strictObject({
	name: z.string().min(1).optional(),
	schema: z.string().optional(),
	catalog: z.string().optional(),
	type: z.string().optional(),
});
const statement = { statement: z.string().regex(/\S/), params: z.array(z.json()).optional() };
export const SqlToolInputs = {
	query: z.strictObject({ ...statement, ...page }),
	exec: z.strictObject(statement),
	ping: z.strictObject({}),
	listObject: z.strictObject({ parent: object.optional(), search: z.string().optional(), ...page }),
	describeObject: z.strictObject({ object: object.extend({ name: z.string().min(1) }) }),
};

export const SqlTools: ServiceSchema['tools'] = Object.fromEntries(
	Object.entries(SqlToolInputs).map(([name, input]) => [
		name,
		{
			description: `SQL ${name}`,
			inputSchema: z.toJSONSchema(input),
			annotations: { readOnlyHint: name !== 'exec', destructiveHint: name === 'exec' },
		},
	]),
);
