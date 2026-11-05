import { z } from 'zod';
import { isSafeGrafanaPath } from '@wener/client/grafana';
import type { ServiceSchema } from './types';

export const GrafanaWriteOperations = new Set(['request']);

const paramValue = z.union([z.string(), z.array(z.string())]);
export const GrafanaToolInputs = {
	health: z.strictObject({}),
	whoAmI: z.strictObject({}),
	request: z.strictObject({
		path: z.string().min(1).max(2048).refine(isSafeGrafanaPath, { message: 'Invalid Grafana request path' }),
		method: z.enum(['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
		params: z.record(z.string(), paramValue).optional(),
		body: z.unknown().optional(),
	}),
};

export const GrafanaTools: ServiceSchema['tools'] = Object.fromEntries(
	Object.keys(GrafanaToolInputs).map((name) => [
		name,
		{
			description: `Grafana ${name}`,
			inputSchema: z.toJSONSchema(GrafanaToolInputs[name as keyof typeof GrafanaToolInputs], { io: 'input' }),
			annotations: {
				readOnlyHint: name !== 'request',
				destructiveHint: name === 'request',
			},
		},
	]),
);
